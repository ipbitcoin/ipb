import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import type { H3Event } from "h3";

export function convexClient() {
  const config = useRuntimeConfig();
  return new ConvexHttpClient(String(config.public.CONVEX_URL));
}

export async function requireAdmin(event: H3Event) {
  const session = await getUserSession(event);
  if (!session?.user) {
    throw createError({ message: "Unauthorized", statusCode: 401 });
  }
  return session.user;
}

export const TABLE_NAMES = [
  "articles",
  "authors",
  "books",
  "categories",
  "docs",
  "enrollments",
  "faqs",
  "ideaCategories",
  "members",
  "newsletters",
  "partners",
  "publishers",
  "socialMediaIdeas",
  "tasks",
  "teamMembers",
  "trainings",
  "values",
] as const;

export type TableName = (typeof TABLE_NAMES)[number];

const allTables = new Set<string>(TABLE_NAMES);
const writableTables = new Set<string>([
  "articles",
  "authors",
  "categories",
  "ideaCategories",
  "socialMediaIdeas",
  "tasks",
  "teamMembers",
  "values",
  "partners",
  "faqs",
  "docs",
  "books",
  "publishers",
  "trainings",
]);

/** Tables whose docs move between status columns via /api/data/[table]/move. */
export const kanbanTables = new Set<string>(["socialMediaIdeas", "tasks"]);

/**
 * Untyped Convex function references for the dynamic per-collection proxy.
 * Every collection module exposes the same admin function names; Convex
 * validates args server-side, so no casts are needed here.
 */
export function tableApi(table: string) {
  return anyApi[table];
}

export function resolveTable(
  event: H3Event,
  opts: { writable?: boolean } = {}
): string {
  const table = getRouterParam(event, "table");
  if (!table || !allTables.has(table)) {
    throw createError({ message: "Unknown collection", statusCode: 404 });
  }
  if (opts.writable && !writableTables.has(table)) {
    throw createError({ message: "Collection is read-only", statusCode: 405 });
  }
  return table;
}
