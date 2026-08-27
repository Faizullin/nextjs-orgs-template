"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { confirm } from "@/components/common/confirm-dialog";
import { selectOne } from "@/components/common/select-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OrgRole } from "@/features/organizations";
import { trpc } from "@/utils/trpc";

/**
 * The three irreversible actions, kept together and away from the ordinary
 * settings above them.
 *
 * Each one goes through `confirm()`; transfer additionally goes through
 * `selectOne()` — two shared dialogs, no local dialog state in this file.
 */
export function OrganizationDangerZone({
  organizationId,
  currentUserRole,
  currentUserId,
}: {
  organizationId: number;
  currentUserRole: OrgRole;
  currentUserId?: number;
}) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const isOwner = currentUserRole === OrgRole.OWNER;

  const afterLeaving = async () => {
    await utils.organization.list.invalidate();
    router.push("/dashboard/orgs");
  };

  const deleteMutation = trpc.organization.delete.useMutation();
  const leaveMutation = trpc.organization.leave.useMutation();
  const transferMutation = trpc.organization.transferOwnership.useMutation();

  const members = trpc.organization.listMembers.useQuery({ organizationId }, { enabled: isOwner });

  const handleDelete = async () => {
    await confirm({
      title: "Delete this organization?",
      description:
        "Every membership goes with it. This cannot be undone, and the slug becomes available to anyone.",
      confirmLabel: "Delete organization",
      destructive: true,
      // Passing `onConfirm` keeps the dialog open and spinning until the
      // mutation settles, so a failure stays visible.
      onConfirm: async () => {
        try {
          await deleteMutation.mutateAsync({ id: organizationId });
          toast.success("Organization deleted");
          await afterLeaving();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Delete failed");
          throw e;
        }
      },
    });
  };

  const handleLeave = async () => {
    await confirm({
      title: "Leave this organization?",
      description: "You lose access immediately. An owner or admin would have to add you back.",
      confirmLabel: "Leave",
      destructive: true,
      onConfirm: async () => {
        try {
          await leaveMutation.mutateAsync({ organizationId });
          toast.success("You left the organization");
          await afterLeaving();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Could not leave");
          throw e;
        }
      },
    });
  };

  const handleTransfer = async () => {
    const candidates = (members.data ?? [])
      .filter((m) => m.user.id !== currentUserId)
      .map((m) => ({ id: m.user.id, label: `${m.user.username} · ${m.user.email}` }));

    if (candidates.length === 0) {
      toast.error("Add another member first — there is no one to transfer to.");
      return;
    }

    const picked = await selectOne<{ id: number; label: string }>({
      title: "Transfer ownership",
      description: "They become the owner; you stay on as an admin.",
      valueKey: "id",
      renderText: (m) => m.label,
      // Already loaded, so this filters in memory rather than round-tripping.
      searchFn: async (search) =>
        candidates.filter((c) => c.label.toLowerCase().includes(search.toLowerCase())),
      confirmLabel: "Transfer",
    });
    if (!picked) return;

    const ok = await confirm({
      title: `Make ${picked.label.split(" · ")[0]} the owner?`,
      description: "You will be demoted to admin and cannot undo this yourself.",
      confirmLabel: "Transfer ownership",
      destructive: true,
    });
    if (!ok) return;

    try {
      await transferMutation.mutateAsync({ organizationId, toUserId: picked.id });
      toast.success("Ownership transferred");
      await Promise.all([
        utils.organization.getById.invalidate({ id: organizationId }),
        utils.organization.listMembers.invalidate({ organizationId }),
        utils.organization.list.invalidate(),
      ]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Transfer failed");
    }
  };

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="text-destructive">Danger zone</CardTitle>
        <CardDescription>These actions cannot be undone.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {isOwner ? (
          <>
            <Button variant="outline" onClick={handleTransfer}>
              Transfer ownership
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete organization
            </Button>
          </>
        ) : (
          <Button variant="destructive" onClick={handleLeave}>
            Leave organization
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
