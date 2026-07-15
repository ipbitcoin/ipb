/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as adminUsers from "../adminUsers.js";
import type * as articles from "../articles.js";
import type * as authors from "../authors.js";
import type * as books from "../books.js";
import type * as categories from "../categories.js";
import type * as docs from "../docs.js";
import type * as enrollments from "../enrollments.js";
import type * as faqs from "../faqs.js";
import type * as ideaCategories from "../ideaCategories.js";
import type * as lib from "../lib.js";
import type * as members from "../members.js";
import type * as migrate from "../migrate.js";
import type * as newsletters from "../newsletters.js";
import type * as partners from "../partners.js";
import type * as publishers from "../publishers.js";
import type * as r2 from "../r2.js";
import type * as socialMediaIdeas from "../socialMediaIdeas.js";
import type * as tasks from "../tasks.js";
import type * as teamMembers from "../teamMembers.js";
import type * as trainings from "../trainings.js";
import type * as values from "../values.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  adminUsers: typeof adminUsers;
  articles: typeof articles;
  authors: typeof authors;
  books: typeof books;
  categories: typeof categories;
  docs: typeof docs;
  enrollments: typeof enrollments;
  faqs: typeof faqs;
  ideaCategories: typeof ideaCategories;
  lib: typeof lib;
  members: typeof members;
  migrate: typeof migrate;
  newsletters: typeof newsletters;
  partners: typeof partners;
  publishers: typeof publishers;
  r2: typeof r2;
  socialMediaIdeas: typeof socialMediaIdeas;
  tasks: typeof tasks;
  teamMembers: typeof teamMembers;
  trainings: typeof trainings;
  values: typeof values;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  r2: import("@convex-dev/r2/_generated/component.js").ComponentApi<"r2">;
};
