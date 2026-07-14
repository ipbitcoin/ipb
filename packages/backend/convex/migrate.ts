/**
 * One-time Strapi → Convex import endpoint. DELETE AFTER CUTOVER.
 *
 * The bun scripts in scripts/migrate/ resolve relations to Convex ids before
 * calling this, so records arrive ready to insert. Idempotent: records are
 * matched by importId and patched instead of duplicated on re-runs.
 */
import { v } from "convex/values";

import { mutation } from "./_generated/server";
import { assertServiceKey } from "./lib";

const importableTables = [
  "articles",
  "authors",
  "categories",
  "teamMembers",
  "values",
  "partners",
  "faqs",
  "docs",
  "books",
  "publishers",
  "trainings",
  "enrollments",
  "members",
  "newsletters",
] as const;

export const importRecords = mutation({
  args: {
    serviceKey: v.string(),
    table: v.union(...importableTables.map((t) => v.literal(t))),
    // Records are validated against the schema on insert/patch by Convex.
    records: v.array(v.object({ data: v.any(), importId: v.string() })),
  },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const { table } = args;
    const results: Record<string, string> = {};

    for (const record of args.records) {
      const existing = await ctx.db
        .query(table)
        .filter((q) => q.eq(q.field("importId"), record.importId))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, record.data);
        results[record.importId] = existing._id;
      } else {
        const id = await ctx.db.insert(table, {
          ...record.data,
          importId: record.importId,
        });
        results[record.importId] = id;
      }
    }

    return results;
  },
});

/** Fetch importId → Convex id map for a table (for relation resolution). */
export const idMap = mutation({
  args: {
    serviceKey: v.string(),
    table: v.union(...importableTables.map((t) => v.literal(t))),
  },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const docs = await ctx.db.query(args.table).collect();
    const map: Record<string, string> = {};
    for (const doc of docs) {
      if (doc.importId) {
        map[doc.importId] = doc._id;
      }
    }
    return map;
  },
});
