"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/utils/trpc";

/**
 * Reads the `UserAccount` mirror over tRPC rather than Clerk's `useUser`.
 * That is the point of the mirror: the row carries our fields (role,
 * provider) and proves the webhook ran.
 */
export function CurrentUserCard() {
  const { data, isLoading, error } = trpc.user.getCurrent.useQuery();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your account</CardTitle>
        <CardDescription>The `UserAccount` row mirrored from Clerk.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}

        {error && (
          <div className="space-y-2 text-sm">
            <p className="text-destructive">{error.message}</p>
            {error.data?.code === "NOT_FOUND" && (
              <p className="text-muted-foreground">
                Signed in with Clerk, but no local row exists — the{" "}
                <code className="font-mono">user.created</code> webhook has not reached this app.
                See the README for tunnelling it in development.
              </p>
            )}
          </div>
        )}

        {data && (
          <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
            <dt className="text-muted-foreground">Username</dt>
            <dd className="font-medium">{data.username}</dd>
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-medium">{data.email}</dd>
            <dt className="text-muted-foreground">Role</dt>
            <dd className="font-medium">{data.role}</dd>
            <dt className="text-muted-foreground">Clerk uid</dt>
            <dd className="truncate font-mono text-xs">{data.uid}</dd>
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
