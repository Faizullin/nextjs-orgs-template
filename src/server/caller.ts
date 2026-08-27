import { appRouter } from "./root";
import { createCallerFactory, createTRPCContext } from "./trpc";

/** Call the API from a Server Component without an HTTP round trip. */
export const trpcCaller = createCallerFactory(appRouter)(createTRPCContext);
