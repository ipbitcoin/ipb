import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { assertServiceKey, localeArg, mediaUrl, pick, pickOpt } from "./lib";

export const list = query({
  args: { locale: localeArg },
  handler: async (ctx, args) => {
    const docs = await ctx.db
      .query("docs")
      .withIndex("by_order")
      .order("asc")
      .collect();
    return docs
      .filter((d) => d.published)
      .map((d) => ({
        description: pickOpt(d.description, args.locale) ?? null,
        document: { url: mediaUrl(pick(d.documentKey, args.locale)) },
        documentId: d._id,
        order: d.order,
        title: pick(d.title, args.locale),
      }));
  },
});

// ── Admin ──────────────────────────────────────────────────────────────────

const localizedString = v.object({ en: v.string(), pt: v.string() });
const localizedOptional = v.object({
  en: v.optional(v.string()),
  pt: v.optional(v.string()),
});

const docFields = {
  description: localizedOptional,
  documentKey: localizedString,
  order: v.number(),
  published: v.boolean(),
  title: localizedString,
};

export const adminList = query({
  args: { serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    return await ctx.db
      .query("docs")
      .withIndex("by_order")
      .order("asc")
      .collect();
  },
});

export const adminGet = query({
  args: { id: v.id("docs"), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    return await ctx.db.get(args.id);
  },
});

export const adminCreate = mutation({
  args: { serviceKey: v.string(), ...docFields },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const { serviceKey: _serviceKey, ...fields } = args;
    return await ctx.db.insert("docs", fields);
  },
});

export const adminUpdate = mutation({
  args: { id: v.id("docs"), serviceKey: v.string(), ...docFields },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const { serviceKey: _serviceKey, id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const adminRemove = mutation({
  args: { id: v.id("docs"), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    await ctx.db.delete(args.id);
  },
});
