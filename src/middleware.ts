import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * Hydrates the Clerk session onto every request so `auth()` works in Server
 * Components, route handlers and Server Actions. It does not decide access.
 *
 * Access is checked at the resource, not by path: `app/dashboard/layout.tsx`
 * redirects an anonymous visitor, and `protectedProcedure` rejects an
 * unauthenticated tRPC call. Clerk deprecated `createRouteMatcher` for exactly
 * this reason — a matcher's idea of the URL space drifts from Next.js's, and
 * the gap is a reachable protected resource.
 */
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
