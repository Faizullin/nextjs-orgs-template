import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest, NextResponse } from "next/server";
import { deleteClerkUser, syncClerkUser } from "@/features/identity/server";

/**
 * The only writer of `UserAccount` rows. Clerk owns the credential; this
 * mirrors just enough of the user to join our own tables against.
 *
 * Subscribe to user.created, user.updated, user.deleted and session.created
 * in the Clerk dashboard. `session.created` is the safety net: it recreates a
 * row for a user who signed up while the webhook endpoint was unreachable.
 */
export async function POST(req: NextRequest) {
  let evt;
  try {
    evt = await verifyWebhook(req);
  } catch (err) {
    console.error("Clerk webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (evt.type) {
      case "user.created":
      case "user.updated": {
        const { id, email_addresses, username, primary_email_address_id } = evt.data;
        const email =
          email_addresses.find((e) => e.id === primary_email_address_id)?.email_address ??
          email_addresses[0]?.email_address ??
          "";
        await syncClerkUser({
          uid: id,
          email,
          username: username || email || id,
        });
        break;
      }

      case "session.created": {
        const { user_id, user } = evt.data;
        const email = user?.email_addresses?.[0]?.email_address ?? "";
        await syncClerkUser({
          uid: user_id,
          email,
          username: user?.username || email || user_id,
        });
        break;
      }

      case "user.deleted": {
        if (evt.data.id) {
          await deleteClerkUser(evt.data.id);
        }
        break;
      }
    }
  } catch (err) {
    // Non-2xx tells Clerk to retry, which is what we want for a transient
    // database failure.
    console.error(`Clerk webhook ${evt.type} failed:`, err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ message: "Webhook received" }, { status: 200 });
}
