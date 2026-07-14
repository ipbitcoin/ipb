/**
 * Step 5: post-import assertions.
 *   - per-table counts match the merged export
 *   - every article mainImageKey exists in R2 (HEAD)
 *   - every article has a category and ≥1 author (flagged, not fatal)
 *   - slug uniqueness per locale
 *   - 5 random articles' markdown byte-equality vs export
 *
 * Usage: CONVEX_URL=... SERVICE_KEY=... R2_* vars... bun scripts/migrate/05-verify.ts
 */
import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { ConvexHttpClient } from "convex/browser";

import { api } from "../../convex/_generated/api";
import { COLLECTIONS, env, readJson } from "./shared";

interface MergedRecord {
  importId: string;
  pt: { content?: string; training?: unknown };
  en: { content?: string };
}

const client = new ConvexHttpClient(env("CONVEX_URL"));
const serviceKey = env("SERVICE_KEY");
const s3 = new S3Client({
  credentials: {
    accessKeyId: env("R2_ACCESS_KEY_ID"),
    secretAccessKey: env("R2_SECRET_ACCESS_KEY"),
  },
  endpoint: env("R2_ENDPOINT"),
  region: "auto",
});
const bucket = env("R2_BUCKET");

const failures: string[] = [];
const flags: string[] = [];

// ── Counts ──────────────────────────────────────────────────────────────────
for (const config of COLLECTIONS) {
  const merged = await readJson<MergedRecord[]>(`${config.table}.merged.json`);
  const idMap = await client.mutation(api.migrate.idMap, {
    serviceKey,
    table: config.table,
  });
  const convexCount = Object.keys(idMap).length;
  let expected = merged.length;
  if (config.table === "enrollments") {
    // records without a training relation are intentionally skipped
    expected = merged.filter((m) => m.pt.training).length;
  }
  if (convexCount === expected) {
    console.log(`${config.table}: ${convexCount} ✓`);
  } else {
    failures.push(
      `${config.table}: count mismatch — export ${expected}, convex ${convexCount}`
    );
  }
}

// ── Articles: media existence, relations, slugs, content equality ───────────
const articlesRaw = await client.query(api.articles.adminList, {
  serviceKey,
});

for (const article of articlesRaw) {
  try {
    await s3.send(
      new HeadObjectCommand({ Bucket: bucket, Key: article.mainImageKey })
    );
  } catch {
    failures.push(
      `article ${article.slug.pt}: mainImageKey ${article.mainImageKey} missing in R2`
    );
  }
  if (!article.categoryId) {
    flags.push(`article ${article.slug.pt}: no category`);
  }
  if (article.authorIds.length === 0) {
    flags.push(`article ${article.slug.pt}: no authors`);
  }
}

for (const locale of ["pt", "en"] as const) {
  const seen = new Set<string>();
  for (const article of articlesRaw) {
    const slug = article.slug[locale];
    if (seen.has(slug)) {
      failures.push(`duplicate ${locale} slug: ${slug}`);
    }
    seen.add(slug);
  }
}

// Byte-equality spot check on 5 articles
const mergedArticles = await readJson<MergedRecord[]>("articles.merged.json");
const byStrapiId = new Map(mergedArticles.map((m) => [m.importId, m]));
const sample = [...articlesRaw].toSorted(() => Math.random() - 0.5).slice(0, 5);
for (const article of sample) {
  const source = article.importId
    ? byStrapiId.get(article.importId)
    : undefined;
  if (!source) {
    continue;
  }
  if (article.content.pt !== (source.pt.content ?? "")) {
    failures.push(`article ${article.slug.pt}: pt content differs from export`);
  }
  if (article.content.en !== (source.en.content ?? "")) {
    failures.push(`article ${article.slug.pt}: en content differs from export`);
  }
}
console.log(`content spot-check on ${sample.length} articles done`);

// ── Report ──────────────────────────────────────────────────────────────────
if (flags.length > 0) {
  console.warn(`\n${flags.length} non-fatal flags:`);
  for (const flag of flags) {
    console.warn(`  - ${flag}`);
  }
}
if (failures.length > 0) {
  console.error(`\n${failures.length} FAILURES:`);
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exit(1);
}
console.log("\nAll verifications passed ✓");
