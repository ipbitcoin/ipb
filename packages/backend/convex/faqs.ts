import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { assertServiceKey, localeArg, pick } from "./lib";

export const list = query({
  args: { locale: localeArg },
  handler: async (ctx, args) => {
    const faqs = await ctx.db
      .query("faqs")
      .withIndex("by_order")
      .order("asc")
      .collect();
    return faqs
      .filter((f) => f.published)
      .map((f) => ({
        answer: pick(f.answer, args.locale),
        documentId: f._id,
        order: f.order,
        question: pick(f.question, args.locale),
      }));
  },
});

// ── Admin ──────────────────────────────────────────────────────────────────

const localizedString = v.object({ en: v.string(), pt: v.string() });

const faqFields = {
  answer: localizedString,
  order: v.number(),
  published: v.boolean(),
  question: localizedString,
};

export const adminList = query({
  args: { serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    return await ctx.db
      .query("faqs")
      .withIndex("by_order")
      .order("asc")
      .collect();
  },
});

export const adminGet = query({
  args: { id: v.id("faqs"), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    return await ctx.db.get(args.id);
  },
});

export const adminCreate = mutation({
  args: { serviceKey: v.string(), ...faqFields },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const { serviceKey: _serviceKey, ...fields } = args;
    return await ctx.db.insert("faqs", fields);
  },
});

export const adminUpdate = mutation({
  args: { id: v.id("faqs"), serviceKey: v.string(), ...faqFields },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const { serviceKey: _serviceKey, id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const adminRemove = mutation({
  args: { id: v.id("faqs"), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    await ctx.db.delete(args.id);
  },
});
