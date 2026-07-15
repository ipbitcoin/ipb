import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { assertServiceKey } from "./lib";

const platformValidator = v.union(
  v.literal("youtube"),
  v.literal("tiktok"),
  v.literal("instagram"),
  v.literal("x")
);

const statusValidator = v.union(
  v.literal("draft"),
  v.literal("pending"),
  v.literal("approved"),
  v.literal("recorded"),
  v.literal("edited"),
  v.literal("posted")
);

const ideaFields = {
  categoryId: v.optional(v.id("ideaCategories")),
  description: v.string(),
  order: v.number(),
  platforms: v.array(platformValidator),
  status: statusValidator,
  title: v.string(),
};

export const adminList = query({
  args: { serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    return await ctx.db.query("socialMediaIdeas").collect();
  },
});

export const adminGet = query({
  args: { id: v.id("socialMediaIdeas"), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    return await ctx.db.get(args.id);
  },
});

export const adminCreate = mutation({
  args: { serviceKey: v.string(), ...ideaFields },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const { serviceKey: _serviceKey, ...fields } = args;
    const now = Date.now();
    return await ctx.db.insert("socialMediaIdeas", {
      ...fields,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const adminUpdate = mutation({
  args: {
    id: v.id("socialMediaIdeas"),
    serviceKey: v.string(),
    ...ideaFields,
  },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const { serviceKey: _serviceKey, id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const adminMove = mutation({
  args: {
    id: v.id("socialMediaIdeas"),
    order: v.number(),
    serviceKey: v.string(),
    status: statusValidator,
  },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    await ctx.db.patch(args.id, {
      order: args.order,
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const adminRemove = mutation({
  args: { id: v.id("socialMediaIdeas"), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    await ctx.db.delete(args.id);
  },
});
