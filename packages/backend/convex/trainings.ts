import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { assertServiceKey, localeArg, pick } from "./lib";

export const listActive = query({
  args: { locale: localeArg },
  handler: async (ctx, args) => {
    const trainings = await ctx.db
      .query("trainings")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();
    return trainings
      .filter((t) => t.published)
      .map((t) => ({
        active: t.active,
        documentId: t._id,
        end_date: t.endDate ?? null,
        location: pick(t.location, args.locale),
        location_url: t.locationUrl ?? null,
        start_date: t.startDate,
        stock: t.stock,
        stock_left: t.stockLeft,
      }));
  },
});

// ── Admin ──────────────────────────────────────────────────────────────────

const localizedString = v.object({ en: v.string(), pt: v.string() });

const trainingFields = {
  active: v.boolean(),
  endDate: v.optional(v.string()),
  location: localizedString,
  locationUrl: v.optional(v.string()),
  published: v.boolean(),
  startDate: v.string(),
  stock: v.number(),
  stockLeft: v.number(),
};

export const adminList = query({
  args: { serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    return await ctx.db.query("trainings").order("desc").collect();
  },
});

export const adminGet = query({
  args: { id: v.id("trainings"), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    return await ctx.db.get(args.id);
  },
});

export const adminCreate = mutation({
  args: { serviceKey: v.string(), ...trainingFields },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const { serviceKey: _serviceKey, ...fields } = args;
    return await ctx.db.insert("trainings", fields);
  },
});

export const adminUpdate = mutation({
  args: { id: v.id("trainings"), serviceKey: v.string(), ...trainingFields },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const { serviceKey: _serviceKey, id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const adminRemove = mutation({
  args: { id: v.id("trainings"), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    await ctx.db.delete(args.id);
  },
});
