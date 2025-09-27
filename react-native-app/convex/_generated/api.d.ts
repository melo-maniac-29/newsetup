/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as crowdfunding from "../crowdfunding.js";
import type * as family from "../family.js";
import type * as hazards from "../hazards.js";
import type * as safehouses from "../safehouses.js";
import type * as seedData from "../seedData.js";
import type * as sos from "../sos.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  crowdfunding: typeof crowdfunding;
  family: typeof family;
  hazards: typeof hazards;
  safehouses: typeof safehouses;
  seedData: typeof seedData;
  sos: typeof sos;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
