import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { assertServiceKey } from "./lib";

const ideaCategoryFields = {
  name: v.string(),
};

export const adminList = query({
  args: { serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    return await ctx.db
      .query("ideaCategories")
      .withIndex("by_name")
      .order("asc")
      .collect();
  },
});

export const adminGet = query({
  args: { id: v.id("ideaCategories"), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    return await ctx.db.get(args.id);
  },
});

export const adminCreate = mutation({
  args: { serviceKey: v.string(), ...ideaCategoryFields },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const { serviceKey: _serviceKey, ...fields } = args;
    return await ctx.db.insert("ideaCategories", fields);
  },
});

export const adminUpdate = mutation({
  args: {
    id: v.id("ideaCategories"),
    serviceKey: v.string(),
    ...ideaCategoryFields,
  },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const { serviceKey: _serviceKey, id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const adminRemove = mutation({
  args: { id: v.id("ideaCategories"), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const inUse = await ctx.db
      .query("socialMediaIdeas")
      .withIndex("by_category", (q) => q.eq("categoryId", args.id))
      .first();
    if (inUse) {
      throw new Error("Categoria em uso por uma ou mais ideias");
    }
    await ctx.db.delete(args.id);
  },
});
