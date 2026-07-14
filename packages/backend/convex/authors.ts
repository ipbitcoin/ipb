import { v } from "convex/values";

import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { assertServiceKey, localeArg, mediaUrl, pickOpt } from "./lib";
import type { Locale } from "./lib";

function toPublicAuthor(author: Doc<"authors">, locale: Locale) {
  return {
    description: pickOpt(author.description, locale) ?? null,
    documentId: author._id,
    linkedin: author.linkedin ?? null,
    name: author.name,
    picture: { url: mediaUrl(author.pictureKey) },
    slug: author.slug,
  };
}

export const list = query({
  args: { locale: localeArg },
  handler: async (ctx, args) => {
    const authors = await ctx.db.query("authors").collect();
    return authors
      .filter((a) => a.published)
      .map((a) => toPublicAuthor(a, args.locale));
  },
});

export const getBySlug = query({
  args: { locale: localeArg, slug: v.string() },
  handler: async (ctx, args) => {
    const author = await ctx.db
      .query("authors")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (!(author && author.published)) {
      return null;
    }
    return toPublicAuthor(author, args.locale);
  },
});

/** Slugs for sitemap generation. */
export const sitemapEntries = query({
  args: {},
  handler: async (ctx) => {
    const authors = await ctx.db.query("authors").collect();
    return authors.filter((a) => a.published).map((a) => ({ slug: a.slug }));
  },
});

// ── Admin ──────────────────────────────────────────────────────────────────

const localizedOptional = v.object({
  en: v.optional(v.string()),
  pt: v.optional(v.string()),
});

const authorFields = {
  description: localizedOptional,
  linkedin: v.optional(v.string()),
  name: v.string(),
  pictureKey: v.string(),
  published: v.boolean(),
  slug: v.string(),
};

export const adminList = query({
  args: { serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    return await ctx.db.query("authors").collect();
  },
});

export const adminGet = query({
  args: { id: v.id("authors"), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    return await ctx.db.get(args.id);
  },
});

export const adminCreate = mutation({
  args: { serviceKey: v.string(), ...authorFields },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const { serviceKey: _serviceKey, ...fields } = args;
    const existing = await ctx.db
      .query("authors")
      .withIndex("by_slug", (q) => q.eq("slug", fields.slug))
      .unique();
    if (existing) {
      throw new Error("Author slug already in use");
    }
    return await ctx.db.insert("authors", fields);
  },
});

export const adminUpdate = mutation({
  args: { id: v.id("authors"), serviceKey: v.string(), ...authorFields },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const { serviceKey: _serviceKey, id, ...fields } = args;
    const existing = await ctx.db
      .query("authors")
      .withIndex("by_slug", (q) => q.eq("slug", fields.slug))
      .unique();
    if (existing && existing._id !== id) {
      throw new Error("Author slug already in use");
    }
    await ctx.db.patch(id, fields);
  },
});

export const adminRemove = mutation({
  args: { id: v.id("authors"), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    await ctx.db.delete(args.id);
  },
});
