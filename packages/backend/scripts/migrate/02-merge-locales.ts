/**
 * Step 2: group per-locale Strapi documents by documentId into single merged
 * records: { importId, published, pt: <raw>, en: <raw> }.
 * Reports documents missing a locale (the existing locale is copied into both
 * and flagged for manual review).
 *
 * Usage: bun scripts/migrate/02-merge-locales.ts
 */
import { COLLECTIONS, readJson, writeJson } from "./shared";

type Raw = Record<string, unknown> & { documentId: string };
type ExportFile = Record<string, Raw[]>;

const warnings: string[] = [];

for (const config of COLLECTIONS) {
  const exportData = await readJson<ExportFile>(`${config.table}.json`);

  const merged: {
    importId: string;
    published: boolean;
    pt: Raw | null;
    en: Raw | null;
  }[] = [];

  if (config.localized) {
    const publishedPt = new Map(
      (exportData.pt ?? []).map((r) => [r.documentId, r])
    );
    const publishedEn = new Map(
      (exportData.en ?? []).map((r) => [r.documentId, r])
    );
    const draftPt = new Map(
      (exportData["pt-draft"] ?? []).map((r) => [r.documentId, r])
    );
    const draftEn = new Map(
      (exportData["en-draft"] ?? []).map((r) => [r.documentId, r])
    );

    const allIds = new Set([
      ...publishedPt.keys(),
      ...publishedEn.keys(),
      ...draftPt.keys(),
      ...draftEn.keys(),
    ]);

    for (const documentId of allIds) {
      const isPublished =
        publishedPt.has(documentId) || publishedEn.has(documentId);
      let pt = publishedPt.get(documentId) ?? draftPt.get(documentId) ?? null;
      let en = publishedEn.get(documentId) ?? draftEn.get(documentId) ?? null;
      if (!pt && en) {
        warnings.push(`${config.table}/${documentId}: missing pt — copied en`);
        pt = en;
      }
      if (!en && pt) {
        warnings.push(`${config.table}/${documentId}: missing en — copied pt`);
        en = pt;
      }
      merged.push({
        en,
        pt,
        published: isPublished,
        importId: documentId,
      });
    }
  } else {
    const published = new Map(
      (exportData.all ?? []).map((r) => [r.documentId, r])
    );
    const drafts = new Map(
      (exportData["all-draft"] ?? []).map((r) => [r.documentId, r])
    );
    const allIds = new Set([...published.keys(), ...drafts.keys()]);
    for (const documentId of allIds) {
      const record =
        published.get(documentId) ?? drafts.get(documentId) ?? null;
      merged.push({
        en: record,
        pt: record,
        published: published.has(documentId) || !config.draftAndPublish,
        importId: documentId,
      });
    }
  }

  console.log(`${config.table}: ${merged.length} merged records`);
  await writeJson(`${config.table}.merged.json`, merged);
}

if (warnings.length > 0) {
  console.warn(`\n${warnings.length} locale warnings:`);
  for (const warning of warnings) {
    console.warn(`  - ${warning}`);
  }
  await writeJson("_locale-warnings.json", warnings);
}

console.log("Merge complete.");
