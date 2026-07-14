import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { assertServiceKey, localeArg, pick } from "./lib";

export const list = query({
  args: { locale: localeArg },
  handler: async (ctx, args) => {
    const values = await ctx.db
      .query("values")
      .withIndex("by_order")
      .order("asc")
      .collect();
    return values
      .filter((value) => value.published)
      .map((value) => ({
        description: pick(value.description, args.locale),
        documentId: value._id,
        order: value.order,
        title: pick(value.title, args.locale),
      }));
  },
});

// ── Admin ──────────────────────────────────────────────────────────────────

const localizedString = v.object({ en: v.string(), pt: v.string() });

const valueFields = {
  description: localizedString,
  order: v.number(),
  published: v.boolean(),
  title: localizedString,
};

export const adminList = query({
  args: { serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    return await ctx.db
      .query("values")
      .withIndex("by_order")
      .order("asc")
      .collect();
  },
});

export const adminGet = query({
  args: { id: v.id("values"), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    return await ctx.db.get(args.id);
  },
});

export const adminCreate = mutation({
  args: { serviceKey: v.string(), ...valueFields },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const { serviceKey: _serviceKey, ...fields } = args;
    return await ctx.db.insert("values", fields);
  },
});

export const adminUpdate = mutation({
  args: { id: v.id("values"), serviceKey: v.string(), ...valueFields },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const { serviceKey: _serviceKey, id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const adminRemove = mutation({
  args: { id: v.id("values"), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    await ctx.db.delete(args.id);
  },
});
