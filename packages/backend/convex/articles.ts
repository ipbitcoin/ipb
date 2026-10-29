import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import { internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { assertServiceKey, localeArg, mediaUrl, pick, pickOpt } from "./lib";
import type { Locale } from "./lib";

const categoryTypeArg = v.union(
  v.literal("research"),
  v.literal("education"),
  v.literal("news")
);

/** Pending reads by id, so articles sharing a category read it only once. */
type CategoryCache = Map<Id<"categories">, Promise<Doc<"categories"> | null>>;

function categoryOf(
  ctx: QueryCtx,
  categoryId: Id<"categories"> | undefined,
  cache: CategoryCache
): Promise<Doc<"categories"> | null> {
  if (!categoryId) {
    return Promise.resolve(null);
  }
  const cached = cache.get(categoryId);
  if (cached) {
    return cached;
  }
  const pending = ctx.db.get(categoryId);
  cache.set(categoryId, pending);
  return pending;
}

/** Body of an article, still read from the retired field until migrated. */
async function contentOf(ctx: QueryCtx, article: Doc<"articles">) {
  const row = await ctx.db
    .query("articleContents")
    .withIndex("by_article", (q) => q.eq("articleId", article._id))
    .unique();
  return row?.content ?? article.content ?? { en: "", pt: "" };
}

/** What an article card renders: lists never show the body or the authors. */
async function toArticleSummary(
  ctx: QueryCtx,
  article: Doc<"articles">,
  locale: Locale,
  categoryCache: CategoryCache
) {
  const category = await categoryOf(ctx, article.categoryId, categoryCache);
  return {
    category: category
      ? {
          name: pick(category.name, locale),
          slug: pick(category.slug, locale),
          type: category.type,
        }
      : null,
    createdAt: new Date(article.createdAt).toISOString(),
    documentId: article._id,
    main_image: { url: mediaUrl(article.mainImageKey) },
    read_time: article.readTime,
    slug: pick(article.slug, locale),
    title: pick(article.title, locale),
  };
}

/** Shape matching the old frontend `Article` type (locale-resolved, absolute media URLs). */
async function toPublicArticle(
  ctx: QueryCtx,
  article: Doc<"articles">,
  locale: Locale,
  categoryCache: CategoryCache = new Map()
) {
  const [summary, authors, content] = await Promise.all([
    toArticleSummary(ctx, article, locale, categoryCache),
    Promise.all(article.authorIds.map((id) => ctx.db.get(id))),
    contentOf(ctx, article),
  ]);

  // Strict per-locale: a pt page must not fall back to the en narration
  const audioKey = article.audioKey?.[locale];

  return {
    ...summary,
    audio: audioKey ? { url: mediaUrl(audioKey) } : null,
    authors: authors
      .filter((a): a is Doc<"authors"> => a !== null)
      .map((a) => ({
        name: a.name,
        slug: a.slug,
        description: pickOpt(a.description, locale) ?? null,
        linkedin: a.linkedin ?? null,
        picture: { url: mediaUrl(a.pictureKey) },
      })),
    content: pick(content, locale),
    updatedAt: new Date(article.updatedAt).toISOString(),
  };
}

/**
 * Article cards, newest first. Reads only the light `articles` docs (bodies
 * live in articleContents) and stops once `limit` matches are found.
 */
export const listPublished = query({
  args: {
    authorId: v.optional(v.id("authors")),
    categorySlug: v.optional(v.string()),
    categoryType: v.optional(categoryTypeArg),
    // Retired: sent only by www builds from before related articles shared
    // one cached query per section. Drop it along with `articles.content`.
    excludeSlug: v.optional(v.string()),
    limit: v.optional(v.number()),
    locale: localeArg,
  },
  handler: async (ctx, args) => {
    const { authorId, categorySlug, categoryType, excludeSlug, limit, locale } =
      args;
    const categoryCache: CategoryCache = new Map();
    const matches: Doc<"articles">[] = [];

    for await (const article of ctx.db
      .query("articles")
      .withIndex("by_published_created", (q) => q.eq("published", true))
      .order("desc")) {
      if (authorId && !article.authorIds.includes(authorId)) {
        continue;
      }
      if (excludeSlug && article.slug[locale] === excludeSlug) {
        continue;
      }
      if (categoryType || categorySlug) {
        const category = await categoryOf(
          ctx,
          article.categoryId,
          categoryCache
        );
        if (
          !category ||
          (categoryType && category.type !== categoryType) ||
          (categorySlug && category.slug[locale] !== categorySlug)
        ) {
          continue;
        }
      }
      matches.push(article);
      if (limit && matches.length >= limit) {
        break;
      }
    }

    return await Promise.all(
      matches.map((a) => toArticleSummary(ctx, a, locale, categoryCache))
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
    const cache: CategoryCache = new Map();
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
    const article = await ctx.db.get(args.id);
    if (!article) {
      return null;
    }
    return { ...article, content: await contentOf(ctx, article) };
  },
});

const localizedString = v.object({ en: v.string(), pt: v.string() });
const localizedOptionalString = v.object({
  en: v.optional(v.string()),
  pt: v.optional(v.string()),
});

const articleFields = {
  audioKey: v.optional(localizedOptionalString),
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

async function saveContent(
  ctx: MutationCtx,
  articleId: Id<"articles">,
  content: { pt: string; en: string }
) {
  const row = await ctx.db
    .query("articleContents")
    .withIndex("by_article", (q) => q.eq("articleId", articleId))
    .unique();
  if (row) {
    await ctx.db.patch(row._id, { content });
  } else {
    await ctx.db.insert("articleContents", { articleId, content });
  }
}

export const adminCreate = mutation({
  args: { serviceKey: v.string(), ...articleFields },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const { serviceKey: _serviceKey, content, ...fields } = args;
    await assertSlugUnique(ctx, fields.slug);
    const now = Date.now();
    const id = await ctx.db.insert("articles", {
      ...fields,
      createdAt: now,
      publishedAt: fields.published ? now : undefined,
      updatedAt: now,
    });
    await saveContent(ctx, id, content);
    return id;
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
    const { serviceKey: _serviceKey, id, content, ...fields } = args;
    await assertSlugUnique(ctx, fields.slug, id);
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Article not found");
    }
    await ctx.db.patch(id, {
      ...fields,
      // Clears the retired copy, so list queries stop reading it
      content: undefined,
      publishedAt:
        fields.published && !existing.published
          ? Date.now()
          : existing.publishedAt,
      updatedAt: Date.now(),
    });
    await saveContent(ctx, id, content);
  },
});

export const adminRemove = mutation({
  args: { id: v.id("articles"), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const row = await ctx.db
      .query("articleContents")
      .withIndex("by_article", (q) => q.eq("articleId", args.id))
      .unique();
    if (row) {
      await ctx.db.delete(row._id);
    }
    await ctx.db.delete(args.id);
  },
});

/**
 * One-time move of article bodies from `articles.content` to articleContents.
 * Idempotent. Run with `npx convex run articles:migrateContent` on each
 * deployment, then drop `content` from the articles schema and this function.
 */
export const migrateContent = internalMutation({
  args: {},
  handler: async (ctx) => {
    let moved = 0;
    const articles = await ctx.db.query("articles").collect();
    for (const article of articles) {
      if (!article.content) {
        continue;
      }
      const row = await ctx.db
        .query("articleContents")
        .withIndex("by_article", (q) => q.eq("articleId", article._id))
        .unique();
      // A row already there was saved by the admin since, so it is newer
      if (!row) {
        await ctx.db.insert("articleContents", {
          articleId: article._id,
          content: article.content,
        });
      }
      await ctx.db.patch(article._id, { content: undefined });
      moved += 1;
    }
    return { articles: articles.length, moved };
  },
});
