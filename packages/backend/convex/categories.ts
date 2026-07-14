import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { assertServiceKey, localeArg, pick } from "./lib";

const categoryTypeArg = v.union(
  v.literal("research"),
  v.literal("education"),
  v.literal("news")
);

export const list = query({
  args: { locale: localeArg, type: v.optional(categoryTypeArg) },
  handler: async (ctx, args) => {
    const { type } = args;
    const categories = type
      ? await ctx.db
          .query("categories")
          .withIndex("by_type", (q) => q.eq("type", type))
          .collect()
      : await ctx.db.query("categories").collect();
    return categories.map((c) => ({
      documentId: c._id,
      name: pick(c.name, args.locale),
      slug: pick(c.slug, args.locale),
      type: c.type,
    }));
  },
});

export const getBySlug = query({
  args: {
    locale: localeArg,
    slug: v.string(),
    type: v.optional(categoryTypeArg),
  },
  handler: async (ctx, args) => {
    const category =
      args.locale === "pt"
        ? await ctx.db
            .query("categories")
            .withIndex("by_slug_pt", (q) => q.eq("slug.pt", args.slug))
            .unique()
        : await ctx.db
            .query("categories")
            .withIndex("by_slug_en", (q) => q.eq("slug.en", args.slug))
            .unique();
    if (!category || (args.type && category.type !== args.type)) {
      return null;
    }
    return {
      documentId: category._id,
      name: pick(category.name, args.locale),
      slug: pick(category.slug, args.locale),
      type: category.type,
    };
  },
});

/** Slugs for sitemap generation (both locales). */
export const sitemapEntries = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").collect();
    return categories.map((c) => ({ slug: c.slug, type: c.type }));
  },
});

// ── Admin ──────────────────────────────────────────────────────────────────

const localizedString = v.object({ en: v.string(), pt: v.string() });

const categoryFields = {
  name: localizedString,
  slug: localizedString,
  type: categoryTypeArg,
};

export const adminList = query({
  args: { serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    return await ctx.db.query("categories").collect();
  },
});

export const adminGet = query({
  args: { id: v.id("categories"), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    return await ctx.db.get(args.id);
  },
});

export const adminCreate = mutation({
  args: { serviceKey: v.string(), ...categoryFields },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const { serviceKey: _serviceKey, ...fields } = args;
    return await ctx.db.insert("categories", fields);
  },
});

export const adminUpdate = mutation({
  args: { id: v.id("categories"), serviceKey: v.string(), ...categoryFields },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const { serviceKey: _serviceKey, id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const adminRemove = mutation({
  args: { id: v.id("categories"), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    await ctx.db.delete(args.id);
  },
});
