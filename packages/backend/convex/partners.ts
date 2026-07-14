import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { assertServiceKey, mediaUrl } from "./lib";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const partners = await ctx.db
      .query("partners")
      .withIndex("by_order")
      .order("asc")
      .collect();
    return partners
      .filter((p) => p.published)
      .map((p) => ({
        documentId: p._id,
        link: p.link ?? null,
        logo: { url: mediaUrl(p.logoKey) },
        name: p.name,
        order: p.order,
      }));
  },
});

// ── Admin ──────────────────────────────────────────────────────────────────

const partnerFields = {
  link: v.optional(v.string()),
  logoKey: v.string(),
  name: v.string(),
  order: v.number(),
  published: v.boolean(),
};

export const adminList = query({
  args: { serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    return await ctx.db
      .query("partners")
      .withIndex("by_order")
      .order("asc")
      .collect();
  },
});

export const adminGet = query({
  args: { id: v.id("partners"), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    return await ctx.db.get(args.id);
  },
});

export const adminCreate = mutation({
  args: { serviceKey: v.string(), ...partnerFields },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const { serviceKey: _serviceKey, ...fields } = args;
    return await ctx.db.insert("partners", fields);
  },
});

export const adminUpdate = mutation({
  args: { id: v.id("partners"), serviceKey: v.string(), ...partnerFields },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const { serviceKey: _serviceKey, id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const adminRemove = mutation({
  args: { id: v.id("partners"), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    await ctx.db.delete(args.id);
  },
});
