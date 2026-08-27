import { auth } from "@clerk/nextjs/server";
import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { UserRole } from "@/features/identity";
import prisma from "./db";

export const createTRPCContext = async () => {
  const session = await auth();

  return {
    db: prisma,
    session,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;

export const createTRPCRouter = t.router;

export const publicProcedure = t.procedure;

/** A Clerk session is present. `ctx.session.userId` is non-null from here on. */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      session: { ...ctx.session, userId: ctx.session.userId },
    },
  });
});

/** As above, plus an ADMIN `UserAccount` — exposed on `ctx.user`. */
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const user = await ctx.db.userAccount.findUnique({
    where: { uid: ctx.session.userId },
  });

  if (!user || user.role !== UserRole.ADMIN) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }

  return next({
    ctx: {
      ...ctx,
      user,
    },
  });
});
