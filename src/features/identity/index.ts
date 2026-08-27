/**
 * Root barrel — `model/` only, so it is safe to import from either
 * environment. Server code imports `@/features/identity/server`; client
 * components import `@/features/identity/client`.
 */
export * from "./model";
