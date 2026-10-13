import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { internalMutation, mutation, query } from "./_generated/server";
import { assertServiceKey, labelColor } from "./lib";

const ideaLabelFields = {
  color: labelColor,
  name: v.string(),
};

export const adminList = query({
  args: { serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    return await ctx.db
      .query("ideaLabels")
      .withIndex("by_name")
      .order("asc")
      .collect();
  },
});

export const adminGet = query({
  args: { id: v.id("ideaLabels"), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    return await ctx.db.get(args.id);
  },
});

export const adminCreate = mutation({
  args: { serviceKey: v.string(), ...ideaLabelFields },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const { serviceKey: _serviceKey, ...fields } = args;
    const name = fields.name.trim();
    if (!name) {
      throw new Error("Nome obrigatório");
    }
    const existing = await ctx.db
      .query("ideaLabels")
      .withIndex("by_name", (q) => q.eq("name", name))
      .first();
    // Typing a name that exists picks that label instead of a twin.
    if (existing) {
      return existing._id;
    }
    return await ctx.db.insert("ideaLabels", { ...fields, name });
  },
});

export const adminUpdate = mutation({
  args: {
    id: v.id("ideaLabels"),
    serviceKey: v.string(),
    ...ideaLabelFields,
  },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const { serviceKey: _serviceKey, id, ...fields } = args;
    const name = fields.name.trim();
    if (!name) {
      throw new Error("Nome obrigatório");
    }
    await ctx.db.patch(id, { ...fields, name });
  },
});

/** Deletes the label and takes it off every idea wearing it. */
export const adminRemove = mutation({
  args: { id: v.id("ideaLabels"), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const ideas = await ctx.db.query("socialMediaIdeas").collect();
    for (const idea of ideas) {
      if (idea.labelIds?.includes(args.id)) {
        await ctx.db.patch(idea._id, {
          labelIds: idea.labelIds.filter((labelId) => labelId !== args.id),
        });
      }
    }
    await ctx.db.delete(args.id);
  },
});

const MIGRATION_COLORS = [
  "blue",
  "green",
  "yellow",
  "orange",
  "red",
  "pink",
  "purple",
  "teal",
] as const;

/**
 * One-time move from idea categories to labels. Each category becomes a label
 * of the same name and every idea gets a label list, its category in it.
 * Idempotent. Run with `npx convex run ideaLabels:migrateFromCategories` on
 * each deployment, then drop ideaCategories, categoryId and this function.
 */
export const migrateFromCategories = internalMutation({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db.query("ideaCategories").collect();
    const labelFor = new Map<Id<"ideaCategories">, Id<"ideaLabels">>();
    for (const [index, category] of categories.entries()) {
      const existing = await ctx.db
        .query("ideaLabels")
        .withIndex("by_name", (q) => q.eq("name", category.name))
        .first();
      const labelId =
        existing?._id ??
        (await ctx.db.insert("ideaLabels", {
          color: MIGRATION_COLORS[index % MIGRATION_COLORS.length] ?? "gray",
          name: category.name,
        }));
      labelFor.set(category._id, labelId);
    }

    let ideasUpdated = 0;
    const ideas = await ctx.db.query("socialMediaIdeas").collect();
    for (const idea of ideas) {
      if (idea.labelIds && !idea.categoryId) {
        continue;
      }
      const labelIds = idea.labelIds ?? [];
      const fromCategory = idea.categoryId && labelFor.get(idea.categoryId);
      await ctx.db.patch(idea._id, {
        categoryId: undefined,
        labelIds:
          fromCategory && !labelIds.includes(fromCategory)
            ? [...labelIds, fromCategory]
            : labelIds,
      });
      ideasUpdated += 1;
    }

    for (const category of categories) {
      await ctx.db.delete(category._id);
    }
    return { categories: categories.length, ideasUpdated };
  },
});
