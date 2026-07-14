import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import { assertServiceKey, localeArg, mediaUrl, pick, pickOpt } from "./lib";
import type { Locale } from "./lib";

const categoryTypeArg = v.union(
  v.literal("research"),
  v.literal("education"),
  v.literal("news")
);

/** Shape matching the old frontend `Article` type (locale-resolved, absolute media URLs). */
async function toPublicArticle(
  ctx: QueryCtx,
  article: Doc<"articles">,
  locale: Locale,
  categoryCache?: Map<string, Doc<"categories"> | null>
) {
  let category: Doc<"categories"> | null = null;
  if (article.categoryId) {
    const cached = categoryCache?.get(article.categoryId);
    category =
      cached === undefined ? await ctx.db.get(article.categoryId) : cached;
    categoryCache?.set(article.categoryId, category);
  }

  const authors = (
    await Promise.all(article.authorIds.map((id) => ctx.db.get(id)))
  ).filter((a): a is Doc<"authors"> => a !== null);

  return {
    audio: article.audioKey ? { url: mediaUrl(article.audioKey) } : null,
    authors: authors.map((a) => ({
      name: a.name,
      slug: a.slug,
      description: pickOpt(a.description, locale) ?? null,
      linkedin: a.linkedin ?? null,
      picture: { url: mediaUrl(a.pictureKey) },
    })),
    category: category
      ? {
          name: pick(category.name, locale),
          slug: pick(category.slug, locale),
          type: category.type,
        }
      : null,
    content: pick(article.content, locale),
    createdAt: new Date(article.createdAt).toISOString(),
    documentId: article._id,
    main_image: { url: mediaUrl(article.mainImageKey) },
    read_time: article.readTime,
    slug: pick(article.slug, locale),
    title: pick(article.title, locale),
    updatedAt: new Date(article.updatedAt).toISOString(),
  };
}

export const listPublished = query({
  args: {
    authorId: v.optional(v.id("authors")),
    categorySlug: v.optional(v.string()),
    categoryType: v.optional(categoryTypeArg),
    excludeSlug: v.optional(v.string()),
    limit: v.optional(v.number()),
    locale: localeArg,
  },
  handler: async (ctx, args) => {
    let articles = await ctx.db
      .query("articles")
      .withIndex("by_published_created", (q) => q.eq("published", true))
      .order("desc")
      .collect();

    const categoryCache = new Map<string, Doc<"categories"> | null>();

    if (args.categoryType || args.categorySlug) {
      const filtered: Doc<"articles">[] = [];
      for (const article of articles) {
        if (!article.categoryId) {
          continue;
        }
        let category = categoryCache.get(article.categoryId);
        if (category === undefined) {
          category = await ctx.db.get(article.categoryId);
          categoryCache.set(article.categoryId, category);
        }
        if (!category) {
          continue;
        }
        if (args.categoryType && category.type !== args.categoryType) {
          continue;
        }
        if (
          args.categorySlug &&
          category.slug[args.locale] !== args.categorySlug
        ) {
          continue;
        }
        filtered.push(article);
      }
      articles = filtered;
    }

    if (args.authorId) {
      articles = articles.filter(
        (a) => args.authorId && a.authorIds.includes(args.authorId)
      );
    }

    if (args.excludeSlug) {
      articles = articles.filter(
        (a) => a.slug[args.locale] !== args.excludeSlug
      );
    }

    if (args.limit) {
      articles = articles.slice(0, args.limit);
    }

    return await Promise.all(
      articles.map((a) => toPublicArticle(ctx, a, args.locale, categoryCache))
    );
  },
});

export const getBySlug = query({
  args: { locale: localeArg, slug: v.string() },
  handler: async (ctx, args) => {
    const article =
      args.locale === "pt"
        ? await ctx.db
            .query("articles")
            .withIndex("by_slug_pt", (q) => q.eq("slug.pt", args.slug))
            .unique()
        : await ctx.db
            .query("articles")
            .withIndex("by_slug_en", (q) => q.eq("slug.en", args.slug))
            .unique();

    if (!(article && article.published)) {
      return null;
    }
    return await toPublicArticle(ctx, article, args.locale);
  },
});

/** Both locales' slugs for a given slug — used by the language switcher / hreflang. */
export const getSlugPair = query({
  args: { locale: localeArg, slug: v.string() },
  handler: async (ctx, args) => {
    const article =
      args.locale === "pt"
        ? await ctx.db
            .query("articles")
            .withIndex("by_slug_pt", (q) => q.eq("slug.pt", args.slug))
            .unique()
        : await ctx.db
            .query("articles")
            .withIndex("by_slug_en", (q) => q.eq("slug.en", args.slug))
            .unique();
    return article ? article.slug : null;
  },
});

/** Feed for RSS: newest-first published articles, both handled per-locale. */
export const rssFeed = query({
  args: { limit: v.optional(v.number()), locale: localeArg },
  handler: async (ctx, args) => {
    const articles = await ctx.db
      .query("articles")
      .withIndex("by_published_created", (q) => q.eq("published", true))
      .order("desc")
      .take(args.limit ?? 50);
    const cache = new Map<string, Doc<"categories"> | null>();
    return await Promise.all(
      articles.map((a) => toPublicArticle(ctx, a, args.locale, cache))
    );
  },
});

/** Slugs + updatedAt for sitemap generation (both locales). */
export const sitemapEntries = query({
  args: {},
  handler: async (ctx) => {
    const articles = await ctx.db
      .query("articles")
      .withIndex("by_published_created", (q) => q.eq("published", true))
      .collect();
    return articles.map((a) => ({
      slug: a.slug,
      updatedAt: new Date(a.updatedAt).toISOString(),
    }));
  },
});

// ── Admin (service) functions ──────────────────────────────────────────────

export const adminList = query({
  args: { serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const articles = await ctx.db.query("articles").order("desc").collect();
    return articles;
  },
});

export const adminGet = query({
  args: { id: v.id("articles"), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    return await ctx.db.get(args.id);
  },
});

const localizedString = v.object({ en: v.string(), pt: v.string() });

const articleFields = {
  audioKey: v.optional(v.string()),
  authorIds: v.array(v.id("authors")),
  categoryId: v.optional(v.id("categories")),
  content: localizedString,
  mainImageKey: v.string(),
  published: v.boolean(),
  readTime: v.number(),
  slug: localizedString,
  title: localizedString,
};

async function assertSlugUnique(
  ctx: QueryCtx,
  slug: { pt: string; en: string },
  excludeId?: Id<"articles">
) {
  const [byPt, byEn] = await Promise.all([
    ctx.db
      .query("articles")
      .withIndex("by_slug_pt", (q) => q.eq("slug.pt", slug.pt))
      .unique(),
    ctx.db
      .query("articles")
      .withIndex("by_slug_en", (q) => q.eq("slug.en", slug.en))
      .unique(),
  ]);
  if ((byPt && byPt._id !== excludeId) || (byEn && byEn._id !== excludeId)) {
    throw new Error("Slug already in use");
  }
}

export const adminCreate = mutation({
  args: { serviceKey: v.string(), ...articleFields },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const { serviceKey: _serviceKey, ...fields } = args;
    await assertSlugUnique(ctx, fields.slug);
    const now = Date.now();
    return await ctx.db.insert("articles", {
      ...fields,
      createdAt: now,
      publishedAt: fields.published ? now : undefined,
      updatedAt: now,
    });
  },
});

export const adminUpdate = mutation({
  args: {
    id: v.id("articles"),
    serviceKey: v.string(),
    ...articleFields,
  },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const { serviceKey: _serviceKey, id, ...fields } = args;
    await assertSlugUnique(ctx, fields.slug, id);
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Article not found");
    }
    await ctx.db.patch(id, {
      ...fields,
      publishedAt:
        fields.published && !existing.published
          ? Date.now()
          : existing.publishedAt,
      updatedAt: Date.now(),
    });
  },
});

export const adminRemove = mutation({
  args: { id: v.id("articles"), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    await ctx.db.delete(args.id);
  },
});
