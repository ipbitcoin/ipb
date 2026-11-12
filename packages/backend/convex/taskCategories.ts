import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { assertServiceKey, labelColor } from "./lib";

const taskCategoryFields = {
  color: labelColor,
  name: v.string(),
};

export const adminList = query({
  args: { serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    return await ctx.db
      .query("taskCategories")
      .withIndex("by_name")
      .order("asc")
      .collect();
  },
});

export const adminGet = query({
  args: { id: v.id("taskCategories"), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    return await ctx.db.get(args.id);
  },
});

export const adminCreate = mutation({
  args: { serviceKey: v.string(), ...taskCategoryFields },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const { serviceKey: _serviceKey, ...fields } = args;
    const name = fields.name.trim();
    if (!name) {
      throw new Error("Nome obrigatório");
    }
    const existing = await ctx.db
      .query("taskCategories")
      .withIndex("by_name", (q) => q.eq("name", name))
      .first();
    // Typing a name that exists picks that category instead of a twin.
    if (existing) {
      return existing._id;
    }
    return await ctx.db.insert("taskCategories", { ...fields, name });
  },
});

export const adminUpdate = mutation({
  args: {
    id: v.id("taskCategories"),
    serviceKey: v.string(),
    ...taskCategoryFields,
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

/** Deletes the category and takes it off every task in it. */
export const adminRemove = mutation({
  args: { id: v.id("taskCategories"), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const tasks = await ctx.db.query("tasks").collect();
    for (const task of tasks) {
      if (task.categoryIds?.includes(args.id)) {
        await ctx.db.patch(task._id, {
          categoryIds: task.categoryIds.filter((id) => id !== args.id),
        });
      }
    }
    await ctx.db.delete(args.id);
  },
});
