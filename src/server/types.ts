import { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { type AppRouter } from "./root";

export type GeneralRouterInputs = inferRouterInputs<AppRouter>;
export type GeneralRouterOutputs = inferRouterOutputs<AppRouter>;
