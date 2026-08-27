import { TRPCError } from "@trpc/server";
import { OrgRole, canManageMembers } from "@/features/organizations";
import type prisma from "@/server/db";

/**
 * Shared access-control helpers — the framework layer every feature router
 * composes. They exist so a procedure states *what it needs* (a user, a
 * member, an owner) instead of re-querying the same two rows with slightly
 * different error strings.
 *
 * `AuthedContext` is the shape `protectedProcedure` guarantees: an
 * authenticated session plus the db handle.
 */

export type AuthedContext = {
  db: typeof prisma;
  session: { userId: string };
};

/** Resolve the Clerk `uid` to the numeric `UserAccount`, or 404. */
export async function requireUser(ctx: AuthedContext) {
  const user = await ctx.db.userAccount.findUnique({
    where: { uid: ctx.session.userId },
  });
  if (!user) {
    throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
  }
  return user;
}

/**
 * Resolve the current user plus their membership in `organizationId`, or 403.
 *
 * A non-member gets FORBIDDEN rather than NOT_FOUND on purpose: the two are
 * indistinguishable to someone probing ids, and FORBIDDEN is the honest answer
 * for the case that actually matters — you are signed in, and this is not
 * yours.
 */
export async function requireOrgMember(ctx: AuthedContext, organizationId: number) {
  const user = await requireUser(ctx);
  const member = await ctx.db.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: user.id } },
  });
  if (!member) {
    throw new TRPCError({ code: "FORBIDDEN", message: "No access to this organization" });
  }
  return { user, member, role: member.role as OrgRole };
}

/** Like `requireOrgMember`, additionally requiring OWNER or ADMIN. */
export async function requireOrgManager(ctx: AuthedContext, organizationId: number) {
  const result = await requireOrgMember(ctx, organizationId);
  if (!canManageMembers(result.role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only owners and admins can perform this action",
    });
  }
  return result;
}

/** Like `requireOrgMember`, additionally requiring OWNER. */
export async function requireOrgOwner(ctx: AuthedContext, organizationId: number) {
  const result = await requireOrgMember(ctx, organizationId);
  if (result.role !== OrgRole.OWNER) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only the organization owner can perform this action",
    });
  }
  return result;
}
