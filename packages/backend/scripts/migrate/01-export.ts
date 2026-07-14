/**
 * Step 1: pull every collection (published + drafts, pt + en) and the media
 * manifest from Strapi REST into scratch/export/*.json.
 *
 * Usage: STRAPI_URL=... STRAPI_SECRET_KEY=... bun scripts/migrate/01-export.ts
 */
import {
  COLLECTIONS,
  ensureDirs,
  pullAll,
  strapiFetch,
  writeJson,
} from "./shared";

ensureDirs();

for (const config of COLLECTIONS) {
  const locales = config.localized ? ["pt", "en"] : [undefined];
  const statuses: ("draft" | undefined)[] = config.draftAndPublish
    ? [undefined, "draft"]
    : [undefined];

  const byKey: Record<string, Record<string, unknown>[]> = {};
  for (const locale of locales) {
    for (const status of statuses) {
      const key = `${locale ?? "all"}${status === "draft" ? "-draft" : ""}`;
      byKey[key] = await pullAll(config, { locale, status });
      console.log(`${config.api} [${key}]: ${byKey[key].length} records`);
    }
  }
  await writeJson(`${config.table}.json`, byKey);
}

// Media manifest
interface UploadFile {
  id: number;
  hash: string;
  ext: string;
  url: string;
  mime: string;
  name: string;
}
const files: UploadFile[] = [];
let page = 1;
for (;;) {
  const res = await strapiFetch<UploadFile[]>(
    `/api/upload/files?pagination[pageSize]=100&pagination[page]=${page}`
  );
  const batch = Array.isArray(res) ? res : [];
  files.push(...batch);
  if (batch.length < 100) {
    break;
  }
  page += 1;
}
console.log(`upload files: ${files.length}`);
await writeJson("_media-manifest.json", files);

console.log("Export complete → scratch/export/");
