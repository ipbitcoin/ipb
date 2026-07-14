import { v } from "convex/values";

import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { assertServiceKey, localeArg, mediaUrl, pick, pickOpt } from "./lib";

export const listActive = query({
  args: { locale: localeArg },
  handler: async (ctx, args) => {
    const books = await ctx.db
      .query("books")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();

    const publisherCache = new Map<string, Doc<"publishers"> | null>();

    const result = [];
    for (const book of books.filter((b) => b.published)) {
      let publisher: Doc<"publishers"> | null = null;
      if (book.publisherId) {
        const cached = publisherCache.get(book.publisherId);
        publisher =
          cached === undefined ? await ctx.db.get(book.publisherId) : cached;
        publisherCache.set(book.publisherId, publisher);
      }
      result.push({
        author: pick(book.author, args.locale),
        cover: book.coverKey ? { url: mediaUrl(book.coverKey) } : undefined,
        description: pickOpt(book.description, args.locale) ?? undefined,
        documentId: book._id,
        pages: book.pages,
        publisher: publisher ? { name: publisher.name } : undefined,
        title: pick(book.title, args.locale),
        url: book.url,
        year: book.year,
      });
    }
    return result;
  },
});

// ── Admin ──────────────────────────────────────────────────────────────────

const localizedString = v.object({ en: v.string(), pt: v.string() });
const localizedOptional = v.object({
  en: v.optional(v.string()),
  pt: v.optional(v.string()),
});

const bookFields = {
  active: v.boolean(),
  author: localizedString,
  coverKey: v.optional(v.string()),
  description: localizedOptional,
  pages: v.optional(v.number()),
  published: v.boolean(),
  publisherId: v.optional(v.id("publishers")),
  title: localizedString,
  url: v.optional(v.string()),
  year: v.optional(v.number()),
};

export const adminList = query({
  args: { serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    return await ctx.db.query("books").collect();
  },
});

export const adminGet = query({
  args: { id: v.id("books"), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    return await ctx.db.get(args.id);
  },
});

export const adminCreate = mutation({
  args: { serviceKey: v.string(), ...bookFields },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const { serviceKey: _serviceKey, ...fields } = args;
    return await ctx.db.insert("books", fields);
  },
});

export const adminUpdate = mutation({
  args: { id: v.id("books"), serviceKey: v.string(), ...bookFields },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const { serviceKey: _serviceKey, id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const adminRemove = mutation({
  args: { id: v.id("books"), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    await ctx.db.delete(args.id);
  },
});
