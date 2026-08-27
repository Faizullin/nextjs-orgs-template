import "server-only";
import prisma from "@/server/db";
import { UserRole } from "../model";

/**
 * The one place a `UserAccount` row is written from Clerk data. The webhook
 * route stays a thin transport wrapper around these two calls, so the same
 * upsert can be reused by a backfill script or a test.
 */

export type ClerkUserInput = {
  uid: string;
  email: string;
  username: string;
};

export async function syncClerkUser({ uid, email, username }: ClerkUserInput) {
  return prisma.userAccount.upsert({
    where: { uid },
    // Clerk owns username and email; role and provider are ours and are set
    // only on first sight.
    update: { username, email },
    create: {
      uid,
      username,
      email,
      provider: "clerk",
      role: UserRole.USER,
    },
  });
}

export async function deleteClerkUser(uid: string) {
  return prisma.userAccount.deleteMany({ where: { uid } });
}
