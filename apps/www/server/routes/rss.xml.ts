/**
 * RSS 2.0 feed for IPB articles.
 * Available at /rss.xml (Portuguese) and /rss-en.xml (English).
 * Used by news aggregators, feed readers, and Google News discovery.
 */
import { api } from "@ipb/backend/api";

function escapeXml(str: string): string {
  return str
    .replaceAll(/&/g, "&amp;")
    .replaceAll(/</g, "&lt;")
    .replaceAll(/>/g, "&gt;")
    .replaceAll(/"/g, "&quot;")
    .replaceAll(/'/g, "&apos;");
}

function stripMarkdown(md: string): string {
  return md
    .replaceAll(/#{1,6}\s+/g, "")
    .replaceAll(/\*\*(.+?)\*\*/g, "$1")
    .replaceAll(/\*(.+?)\*/g, "$1")
    .replaceAll(/`(.+?)`/g, "$1")
    .replaceAll(/\[(.+?)\]\(.+?\)/g, "$1")
    .replaceAll(/!\[.*?\]\(.+?\)/g, "")
    .replaceAll(/\n{2,}/g, " ")
    .trim();
}

export default defineEventHandler(async (event) => {
  const baseUrl = "https://institutobitcoin.pt";

  // Detect locale from path
  const path = event.path ?? "";
  const isEn = path.includes("rss-en");
  const locale = isEn ? "en" : "pt";

  const convex = convexClient();
  const articles = await convex
    .query(api.articles.rssFeed, { limit: 50, locale })
    .catch(() => []);

  const channelTitle = isEn
    ? "Portuguese Bitcoin Institute — Articles"
    : "Instituto Português de Bitcoin — Artigos";
  const channelDesc = isEn
    ? "Research, education and news about Bitcoin in Portugal, by the Portuguese Bitcoin Institute."
    : "Investigação, educação e notícias sobre Bitcoin em Portugal, pelo Instituto Português de Bitcoin.";
  const channelLink = isEn ? `${baseUrl}/en` : baseUrl;
  const channelLang = isEn ? "en-US" : "pt-PT";

  const items = articles
    .map((a) => {
      const articlePath = isEn ? `/en/article/${a.slug}` : `/artigo/${a.slug}`;
      const articleUrl = `${baseUrl}${articlePath}`;
      const imgUrl = a.main_image?.url ?? `${baseUrl}/og-image.png`;
      const summary = stripMarkdown(a.content ?? "").slice(0, 300);
      const authors = a.authors?.map((au) => au.name).join(", ") || "IPB";
      const category = a.category?.name ?? "";
      const pubDate = new Date(a.createdAt).toUTCString();

      return `
    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${escapeXml(articleUrl)}</link>
      <guid isPermaLink="true">${escapeXml(articleUrl)}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>${escapeXml(`info@institutobitcoin.pt (${authors})`)}</author>
      ${category ? `<category>${escapeXml(category)}</category>` : ""}
      <description>${escapeXml(summary)}</description>
      <enclosure url="${escapeXml(imgUrl)}" type="image/jpeg" length="0" />
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(channelTitle)}</title>
    <link>${escapeXml(channelLink)}</link>
    <description>${escapeXml(channelDesc)}</description>
    <language>${channelLang}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(`${baseUrl}/${isEn ? "rss-en.xml" : "rss.xml"}`)}" rel="self" type="application/rss+xml" />
    <image>
      <url>${baseUrl}/ipb_color_dark.svg</url>
      <title>${escapeXml(channelTitle)}</title>
      <link>${escapeXml(channelLink)}</link>
    </image>
    ${items}
  </channel>
</rss>`;

  setHeader(event, "Content-Type", "application/rss+xml; charset=UTF-8");
  setHeader(event, "Cache-Control", "public, max-age=3600, s-maxage=3600");

  return xml;
});
