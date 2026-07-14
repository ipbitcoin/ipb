import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { assertServiceKey } from "./lib";

// ── Admin ──────────────────────────────────────────────────────────────────
// Publishers are only read through books on the public site.

const publisherFields = {
  description: v.optional(v.string()),
  name: v.string(),
  slug: v.string(),
  website: v.optional(v.string()),
};

export const adminList = query({
  args: { serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    return await ctx.db.query("publishers").collect();
  },
});

export const adminGet = query({
  args: { id: v.id("publishers"), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    return await ctx.db.get(args.id);
  },
});

export const adminCreate = mutation({
  args: { serviceKey: v.string(), ...publisherFields },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const { serviceKey: _serviceKey, ...fields } = args;
    const existing = await ctx.db
      .query("publishers")
      .withIndex("by_slug", (q) => q.eq("slug", fields.slug))
      .unique();
    if (existing) {
      throw new Error("Publisher slug already in use");
    }
    return await ctx.db.insert("publishers", fields);
  },
});

export const adminUpdate = mutation({
  args: { id: v.id("publishers"), serviceKey: v.string(), ...publisherFields },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const { serviceKey: _serviceKey, id, ...fields } = args;
    const existing = await ctx.db
      .query("publishers")
      .withIndex("by_slug", (q) => q.eq("slug", fields.slug))
      .unique();
    if (existing && existing._id !== id) {
      throw new Error("Publisher slug already in use");
    }
    await ctx.db.patch(id, fields);
  },
});

export const adminRemove = mutation({
  args: { id: v.id("publishers"), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    await ctx.db.delete(args.id);
  },
});
