/**
 * Root barrel — `model/` only, so it is safe to import from either
 * environment. Server code imports `@/features/organizations/server`; client
 * components import `@/features/organizations/client`.
 */
export * from "./model";
