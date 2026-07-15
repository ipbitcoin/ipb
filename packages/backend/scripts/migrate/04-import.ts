/**
 * Step 4: transform merged records to Convex shape (camelCase, localized
 * objects, R2 keys, resolved relations) and import them in dependency order.
 * Idempotent — re-runs patch by importId.
 *
 * Usage: CONVEX_URL=... SERVICE_KEY=... bun scripts/migrate/04-import.ts
 */
import { ConvexHttpClient } from "convex/browser";
import type { FunctionArgs } from "convex/server";

import { api } from "../../convex/_generated/api";
import { env, nameToSlug, readJson } from "./shared";

type ImportableTable = FunctionArgs<typeof api.migrate.importRecords>["table"];

// oxlint-disable-next-line typescript/no-explicit-any
type Raw = Record<string, any>;
interface Merged {
  importId: string;
  /** ids of split per-language documents fused into this record (step 2) */
  aliasImportIds?: string[];
  published: boolean;
  pt: Raw;
  en: Raw;
}

/**
 * Relation references may point at a document that was fused into another
 * record during the merge step — make the absorbed ids resolve too.
 */
function withAliases(
  idMap: Record<string, string>,
  rows: Merged[]
): Record<string, string> {
  const extended = { ...idMap };
  for (const row of rows) {
    for (const alias of row.aliasImportIds ?? []) {
      const target = idMap[row.importId];
      if (target) {
        extended[alias] = target;
      }
    }
  }
  return extended;
}

const client = new ConvexHttpClient(env("CONVEX_URL"));
const serviceKey = env("SERVICE_KEY");
const mediaMap = await readJson<Record<string, string>>("_media-map.json");
const warnings: string[] = [];

function mediaKey(
  media: Raw | null | undefined,
  context: string
): string | undefined {
  if (!media?.url) {
    return undefined;
  }
  const key = mediaMap[media.url];
  if (!key) {
    warnings.push(`${context}: media ${media.url} not in media map`);
    return undefined;
  }
  return key;
}

function requiredMediaKey(
  media: Raw | null | undefined,
  context: string
): string {
  const key = mediaKey(media, context);
  if (!key) {
    throw new Error(`${context}: required media missing`);
  }
  return key;
}

/** Single media field that was localized in Strapi — flatten, warn when locales differ. */
function flattenLocalizedMedia(
  m: Merged,
  field: string,
  context: string
): string | undefined {
  const ptKey = mediaKey(m.pt[field], `${context}.pt`);
  const enKey = mediaKey(m.en[field], `${context}.en`);
  if (ptKey && enKey && ptKey !== enKey) {
    warnings.push(
      `${context}: pt/en media differ (${ptKey} vs ${enKey}) — kept pt`
    );
  }
  return ptKey ?? enKey;
}

/**
 * Scalar field that was localized in Strapi but is stored non-localized in
 * Convex (dates, numbers, URLs) — flatten to pt, warn when en diverges so
 * nothing is dropped silently.
 */
function flattenLocalizedScalar(m: Merged, field: string, context: string) {
  const ptValue = m.pt[field];
  const enValue = m.en[field];
  if (ptValue != null && enValue != null && ptValue !== enValue) {
    warnings.push(
      `${context}.${field}: pt/en differ (${ptValue} vs ${enValue}) — kept pt`
    );
  }
  return ptValue ?? enValue;
}

const loc = (m: Merged, field: string) => ({
  en: String(m.en[field] ?? ""),
  pt: String(m.pt[field] ?? ""),
});
const locOpt = (m: Merged, field: string) => ({
  en: m.en[field] != null ? String(m.en[field]) : undefined,
  pt: m.pt[field] != null ? String(m.pt[field]) : undefined,
});

async function importTable(
  table: ImportableTable,
  records: { importId: string; data: Raw }[]
): Promise<Record<string, string>> {
  const idMap: Record<string, string> = {};
  for (let i = 0; i < records.length; i += 25) {
    const chunk = records.slice(i, i + 25);
    const result = await client.mutation(api.migrate.importRecords, {
      records: chunk,
      serviceKey,
      table,
    });
    Object.assign(idMap, result);
  }
  console.log(`${table}: imported ${records.length}`);
  return idMap;
}

const read = (table: string) => readJson<Merged[]>(`${table}.merged.json`);

// ── publishers ──────────────────────────────────────────────────────────────
const publishers = await read("publishers");
const publisherIdsRaw = await importTable(
  "publishers",
  publishers.map((m) => ({
    data: {
      description: m.pt.description ?? undefined,
      name: String(m.pt.name),
      slug: String(m.pt.slug),
      website: m.pt.website ?? undefined,
    },
    importId: m.importId,
  }))
);
const publisherIds = withAliases(publisherIdsRaw, publishers);

// ── categories ──────────────────────────────────────────────────────────────
const categories = await read("categories");
const categoryIdsRaw = await importTable(
  "categories",
  categories.map((m) => ({
    data: { name: loc(m, "name"), slug: loc(m, "slug"), type: m.pt.type },
    importId: m.importId,
  }))
);
const categoryIds = withAliases(categoryIdsRaw, categories);

// ── authors (materialize slug, fail loudly on collisions) ──────────────────
const authors = await read("authors");
const authorSlugs = new Map<string, string>();
for (const m of authors) {
  const slug = nameToSlug(String(m.pt.name));
  const existing = authorSlugs.get(slug);
  if (existing && existing !== m.importId) {
    throw new Error(
      `Author slug collision: "${slug}" (${existing} vs ${m.importId})`
    );
  }
  authorSlugs.set(slug, m.importId);
}
const authorIdsRaw = await importTable(
  "authors",
  authors.map((m) => ({
    data: {
      description: locOpt(m, "description"),
      name: String(m.pt.name),
      pictureKey: requiredMediaKey(m.pt.picture, `authors/${m.importId}`),
      published: m.published,
      slug: nameToSlug(String(m.pt.name)),
    },
    importId: m.importId,
  }))
);
const authorIds = withAliases(authorIdsRaw, authors);

// ── teamMembers ─────────────────────────────────────────────────────────────
const teamMembers = await read("teamMembers");
await importTable(
  "teamMembers",
  teamMembers.map((m) => ({
    data: {
      description: loc(m, "description"),
      linkedin:
        flattenLocalizedScalar(m, "linkedin", `teamMembers/${m.importId}`) ??
        undefined,
      name: String(m.pt.name),
      nostr:
        flattenLocalizedScalar(m, "nostr", `teamMembers/${m.importId}`) ??
        undefined,
      order: Number(m.pt.order ?? 0),
      pictureKey: requiredMediaKey(m.pt.picture, `teamMembers/${m.importId}`),
      published: m.published,
      role: loc(m, "role"),
    },
    importId: m.importId,
  }))
);

// ── values ──────────────────────────────────────────────────────────────────
const values = await read("values");
await importTable(
  "values",
  values.map((m) => ({
    data: {
      description: loc(m, "description"),
      order: Number(m.pt.order ?? 0),
      published: m.published,
      title: loc(m, "title"),
    },
    importId: m.importId,
  }))
);

// ── partners ────────────────────────────────────────────────────────────────
const partners = await read("partners");
await importTable(
  "partners",
  partners.map((m) => ({
    data: {
      link: m.pt.link ?? undefined,
      logoKey: requiredMediaKey(m.pt.logo, `partners/${m.importId}`),
      name: String(m.pt.name),
      order: Number(m.pt.order ?? 0),
      published: m.published,
    },
    importId: m.importId,
  }))
);

// ── faqs ────────────────────────────────────────────────────────────────────
const faqs = await read("faqs");
await importTable(
  "faqs",
  faqs.map((m) => ({
    data: {
      answer: loc(m, "answer"),
      order: Number(m.pt.order ?? 0),
      published: m.published,
      question: loc(m, "question"),
    },
    importId: m.importId,
  }))
);

// ── docs (document file is localized — keep both) ──────────────────────────
const docs = await read("docs");
await importTable(
  "docs",
  docs.map((m) => ({
    data: {
      description: locOpt(m, "description"),
      documentKey: {
        en: requiredMediaKey(m.en.document, `docs/${m.importId}.en`),
        pt: requiredMediaKey(m.pt.document, `docs/${m.importId}.pt`),
      },
      order: Number(m.pt.order ?? 0),
      published: m.published,
      title: loc(m, "title"),
    },
    importId: m.importId,
  }))
);

// ── trainings ───────────────────────────────────────────────────────────────
const trainings = await read("trainings");
const trainingIdsRaw = await importTable(
  "trainings",
  trainings.map((m) => ({
    data: {
      active: Boolean(m.pt.active),
      endDate:
        flattenLocalizedScalar(m, "end_date", `trainings/${m.importId}`) ??
        undefined,
      location: loc(m, "location"),
      locationUrl:
        flattenLocalizedScalar(m, "location_url", `trainings/${m.importId}`) ??
        undefined,
      published: m.published,
      startDate: String(
        flattenLocalizedScalar(m, "start_date", `trainings/${m.importId}`)
      ),
      stock: Number(m.pt.stock ?? 0),
      stockLeft: Number(m.pt.stock_left ?? 0),
    },
    importId: m.importId,
  }))
);
const trainingIds = withAliases(trainingIdsRaw, trainings);

// ── books ───────────────────────────────────────────────────────────────────
const books = await read("books");
await importTable(
  "books",
  books.map((m) => ({
    data: {
      active:
        flattenLocalizedScalar(m, "active", `books/${m.importId}`) !== false,
      author: loc(m, "author"),
      coverKey: flattenLocalizedMedia(m, "cover", `books/${m.importId}`),
      description: locOpt(m, "description"),
      pages: (() => {
        const pages = flattenLocalizedScalar(m, "pages", `books/${m.importId}`);
        return pages != null ? Number(pages) : undefined;
      })(),
      published: m.published,
      publisherId: m.pt.publisher?.documentId
        ? publisherIds[m.pt.publisher.documentId]
        : undefined,
      title: loc(m, "title"),
      url: flattenLocalizedScalar(m, "url", `books/${m.importId}`) ?? undefined,
      year: (() => {
        const year = flattenLocalizedScalar(m, "year", `books/${m.importId}`);
        return year != null ? Number(year) : undefined;
      })(),
    },
    importId: m.importId,
  }))
);

// ── articles ────────────────────────────────────────────────────────────────
const articles = await read("articles");
for (const localeKey of ["pt", "en"] as const) {
  const seen = new Map<string, string>();
  for (const m of articles) {
    const slug = String(m[localeKey].slug);
    const existing = seen.get(slug);
    if (existing && existing !== m.importId) {
      throw new Error(`Article slug collision (${localeKey}): "${slug}"`);
    }
    seen.set(slug, m.importId);
  }
}
await importTable(
  "articles",
  articles.map((m) => ({
    data: {
      // audio narration is per-locale content — keep both keys
      audioKey: {
        en: mediaKey(m.en.audio, `articles/${m.importId}.audio.en`),
        pt: mediaKey(m.pt.audio, `articles/${m.importId}.audio.pt`),
      },
      authorIds: (m.pt.authors ?? [])
        .map((a: Raw) => authorIds[a.documentId])
        .filter(Boolean),
      categoryId: m.pt.category?.documentId
        ? categoryIds[m.pt.category.documentId]
        : undefined,
      content: loc(m, "content"),
      createdAt: Date.parse(m.pt.createdAt),
      mainImageKey: requiredMediaKey(m.pt.main_image, `articles/${m.importId}`),
      published: m.published,
      publishedAt: m.pt.publishedAt ? Date.parse(m.pt.publishedAt) : undefined,
      readTime: Number(m.pt.read_time ?? 0),
      slug: loc(m, "slug"),
      title: loc(m, "title"),
      updatedAt: Date.parse(m.pt.updatedAt),
    },
    importId: m.importId,
  }))
);

// ── members ─────────────────────────────────────────────────────────────────
const members = await read("members");
await importTable(
  "members",
  members.map((m) => ({
    data: {
      address: m.pt.address ?? undefined,
      birthday: m.pt.birthday ?? undefined,
      citizenCardNumber: m.pt.citizen_card_number ?? undefined,
      email: String(m.pt.email),
      fiscalNumber: m.pt.fiscal_number ?? undefined,
      name: String(m.pt.name),
      paymentPlan: m.pt.payment_plan ?? "yearly",
      paymentStatus: m.pt.payment_status ?? "pending",
      stripeCustomerId: m.pt.stripe_customer_id ?? undefined,
      stripeSubscriptionId: m.pt.stripe_subscription_id ?? undefined,
    },
    importId: m.importId,
  }))
);

// ── newsletters ─────────────────────────────────────────────────────────────
const newsletters = await read("newsletters");
await importTable(
  "newsletters",
  newsletters.map((m) => ({
    data: {
      email: String(m.pt.email).toLowerCase(),
      name: m.pt.name ?? undefined,
    },
    importId: m.importId,
  }))
);

// ── enrollments ─────────────────────────────────────────────────────────────
const enrollments = await read("enrollments");
const enrollmentRecords = [];
for (const m of enrollments) {
  const trainingDocId = m.pt.training?.documentId;
  const trainingId = trainingDocId ? trainingIds[trainingDocId] : undefined;
  if (!trainingId) {
    warnings.push(
      `enrollments/${m.importId}: missing training relation — skipped`
    );
    continue;
  }
  enrollmentRecords.push({
    data: {
      birthday: String(m.pt.birthday ?? ""),
      boughtBitcoin: m.pt.bought_bitcoin ?? undefined,
      email: String(m.pt.email),
      expectations: m.pt.expectations ?? undefined,
      hasExposure: m.pt.has_exposure ?? undefined,
      hasSelfCustody: m.pt.has_self_custody ?? undefined,
      invoice: m.pt.invoice ?? undefined,
      name: String(m.pt.name ?? ""),
      nif: m.pt.nif ?? undefined,
      orderId: String(m.pt.order_id ?? ""),
      participatedWorkshop: m.pt.participated_workshop ?? undefined,
      paymentStatus: m.pt.payment_status ?? "pending",
      phone: m.pt.phone ?? undefined,
      stripeId: m.pt.stripe_id ?? undefined,
      trainingId,
      value: Number(m.pt.value ?? 0),
    },
    importId: m.importId,
  });
}
await importTable("enrollments", enrollmentRecords);

if (warnings.length > 0) {
  console.warn(`\n${warnings.length} warnings:`);
  for (const warning of warnings) {
    console.warn(`  - ${warning}`);
  }
}
console.log("Import complete.");
