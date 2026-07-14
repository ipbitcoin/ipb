/**
 * Dynamic sitemap URL source for @nuxtjs/sitemap.
 * Fetches articles, categories and authors from Convex and returns
 * localised URL entries for PT (default) and EN.
 */
import { api } from "@ipb/backend/api";

export default defineEventHandler(async () => {
  const convex = convexClient();

  const [articles, categories, authors] = await Promise.all([
    convex.query(api.articles.sitemapEntries, {}).catch(() => []),
    convex.query(api.categories.sitemapEntries, {}).catch(() => []),
    convex.query(api.authors.sitemapEntries, {}).catch(() => []),
  ]);

  const urls: object[] = [];

  // ── Article pages ────────────────────────────────────────────────────
  for (const article of articles) {
    urls.push(
      {
        alternatives: [
          { hreflang: "pt", href: `/artigo/${article.slug.pt}` },
          { hreflang: "en", href: `/en/article/${article.slug.en}` },
        ],
        changefreq: "monthly",
        lastmod: article.updatedAt,
        loc: `/artigo/${article.slug.pt}`,
        priority: 0.7,
      },
      {
        loc: `/en/article/${article.slug.en}`,
        lastmod: article.updatedAt,
        changefreq: "monthly",
        priority: 0.7,
        alternatives: [
          { hreflang: "pt", href: `/artigo/${article.slug.pt}` },
          { hreflang: "en", href: `/en/article/${article.slug.en}` },
        ],
      }
    );
  }

  // ── Research category pages ──────────────────────────────────────────
  for (const category of categories.filter((c) => c.type === "research")) {
    urls.push(
      {
        changefreq: "weekly",
        loc: `/investigacao/${category.slug.pt}`,
        priority: 0.6,
      },
      {
        loc: `/en/research/${category.slug.en}`,
        changefreq: "weekly",
        priority: 0.6,
      }
    );
  }

  // ── Author pages ────────────────────────────────────────────────────
  for (const author of authors) {
    urls.push(
      {
        changefreq: "monthly",
        loc: `/autor/${author.slug}`,
        priority: 0.5,
      },
      {
        loc: `/en/author/${author.slug}`,
        changefreq: "monthly",
        priority: 0.5,
      }
    );
  }

  return urls;
});
