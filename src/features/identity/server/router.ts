import "server-only";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { requireUser } from "@/server/auth";
import { adminProcedure, createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { listUsersInputSchema, updateProfileInputSchema, userRoleSchema } from "../model";

/**
 * Identity feature — who the caller is. Authentication itself is Clerk's;
 * this router owns the `UserAccount` mirror (`identity.prisma`).
 */
export const userRouter = createTRPCRouter({
  /** The signed-in user's own row. The one call a client always needs. */
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    return requireUser(ctx);
  }),

  updateProfile: protectedProcedure
    .input(updateProfileInputSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await requireUser(ctx);

      const taken = await ctx.db.userAccount.findFirst({
        where: { username: input.username, NOT: { id: user.id } },
      });
      if (taken) {
        throw new TRPCError({ code: "CONFLICT", message: "Username already taken" });
      }

      return ctx.db.userAccount.update({
        where: { id: user.id },
        data: { username: input.username },
      });
    }),

  adminList: adminProcedure.input(listUsersInputSchema).query(async ({ ctx, input }) => {
    const { filter, orderBy, pagination } = input;

    const where: Prisma.UserAccountWhereInput = {};
    if (filter?.username) {
      where.username = { contains: filter.username };
    }
    if (filter?.email) {
      where.email = { contains: filter.email };
    }
    if (filter?.role) {
      where.role = filter.role;
    }

    const orderByClause: Prisma.UserAccountOrderByWithRelationInput = orderBy
      ? { [orderBy.field]: orderBy.direction }
      : { createdAt: "desc" };

    const [items, total] = await Promise.all([
      ctx.db.userAccount.findMany({
        where,
        orderBy: orderByClause,
        skip: pagination.skip,
        take: pagination.take,
      }),
      ctx.db.userAccount.count({ where }),
    ]);

    return {
      items,
      total,
      meta: { skip: pagination.skip, take: pagination.take },
    };
  }),

  updateRole: adminProcedure
    .input(z.object({ id: z.number(), role: userRoleSchema }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.userAccount.update({
        where: { id: input.id },
        data: { role: input.role },
      });
    }),
});
