/** Shared config + helpers for the Strapi → Convex migration scripts. */
import { mkdirSync } from "node:fs";
import { join } from "node:path";

export const EXPORT_DIR = join(import.meta.dir, "../../scratch/export");
export const MEDIA_DIR = join(import.meta.dir, "../../scratch/media");

export function ensureDirs() {
  mkdirSync(EXPORT_DIR, { recursive: true });
  mkdirSync(MEDIA_DIR, { recursive: true });
}

export function env(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var ${name}`);
  }
  return value;
}

export type ConvexTable =
  | "articles"
  | "authors"
  | "categories"
  | "teamMembers"
  | "values"
  | "partners"
  | "faqs"
  | "docs"
  | "books"
  | "publishers"
  | "trainings"
  | "enrollments"
  | "members"
  | "newsletters";

/** Strapi collection config: API plural id, localization, media fields, relations. */
export interface CollectionConfig {
  /** Strapi REST plural (URL segment) */
  api: string;
  /** Convex table name */
  table: ConvexTable;
  /** collection has i18n enabled (fetch pt + en, merge by documentId) */
  localized: boolean;
  /** collection has draftAndPublish (fetch drafts too, set published flag) */
  draftAndPublish: boolean;
  populate?: string[];
}

export const COLLECTIONS: CollectionConfig[] = [
  {
    api: "publishers",
    draftAndPublish: false,
    localized: false,
    table: "publishers",
  },
  {
    api: "categories",
    draftAndPublish: false,
    localized: true,
    table: "categories",
  },
  {
    api: "authors",
    draftAndPublish: true,
    localized: true,
    populate: ["picture"],
    table: "authors",
  },
  {
    api: "team-members",
    draftAndPublish: true,
    localized: true,
    populate: ["picture"],
    table: "teamMembers",
  },
  { api: "values", draftAndPublish: true, localized: true, table: "values" },
  {
    api: "partners",
    draftAndPublish: true,
    localized: false,
    populate: ["logo"],
    table: "partners",
  },
  { api: "faqs", draftAndPublish: true, localized: true, table: "faqs" },
  {
    api: "docs",
    draftAndPublish: true,
    localized: true,
    populate: ["document"],
    table: "docs",
  },
  {
    api: "trainings",
    draftAndPublish: true,
    localized: true,
    table: "trainings",
  },
  {
    api: "books",
    draftAndPublish: true,
    localized: true,
    populate: ["cover", "publisher"],
    table: "books",
  },
  {
    api: "articles",
    draftAndPublish: true,
    localized: true,
    populate: ["main_image", "audio", "category", "authors"],
    table: "articles",
  },
  {
    api: "members",
    draftAndPublish: false,
    localized: false,
    table: "members",
  },
  {
    api: "newsletters",
    draftAndPublish: false,
    localized: false,
    table: "newsletters",
  },
  {
    api: "enrollments",
    draftAndPublish: false,
    localized: false,
    populate: ["training"],
    table: "enrollments",
  },
];

export async function strapiFetch<T>(path: string): Promise<T> {
  const url = `${env("STRAPI_URL")}${path}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${env("STRAPI_SECRET_KEY")}` },
  });
  if (!res.ok) {
    throw new Error(`Strapi ${res.status} on ${url}: ${await res.text()}`);
  }
  // fetch json() is untyped; the caller declares the expected shape
  return await res.json();
}

interface StrapiListResponse {
  data: Record<string, unknown>[];
  meta: { pagination: { page: number; pageCount: number } };
}

/** Paginated pull of a whole collection for one locale/status combination. */
export async function pullAll(
  config: CollectionConfig,
  opts: { locale?: string; status?: "draft" } = {}
): Promise<Record<string, unknown>[]> {
  const records: Record<string, unknown>[] = [];
  let page = 1;
  let pageCount = 1;
  while (page <= pageCount) {
    const params = new URLSearchParams();
    params.set("pagination[page]", String(page));
    params.set("pagination[pageSize]", "100");
    if (opts.locale) {
      params.set("locale", opts.locale);
    }
    if (opts.status) {
      params.set("status", opts.status);
    }
    for (const [i, field] of (config.populate ?? []).entries()) {
      params.set(`populate[${i}]`, field);
    }
    const res = await strapiFetch<StrapiListResponse>(
      `/api/${config.api}?${params.toString()}`
    );
    records.push(...res.data);
    pageCount = res.meta.pagination.pageCount;
    page += 1;
  }
  return records;
}

export function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replaceAll(/[̀-ͯ]/g, "")
    .replaceAll(/[^a-z0-9\s-]/g, "")
    .trim()
    .replaceAll(/\s+/g, "-");
}

export function readJson<T>(file: string): Promise<T> {
  // Bun's json() is untyped; the caller declares the expected shape
  return Bun.file(join(EXPORT_DIR, file)).json();
}

export async function writeJson(file: string, data: unknown) {
  await Bun.write(join(EXPORT_DIR, file), JSON.stringify(data, null, 2));
}
