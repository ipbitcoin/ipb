/**
 * Step 2: group per-locale Strapi documents by documentId into single merged
 * records: { importId, published, pt: <raw>, en: <raw> }.
 *
 * Some content was created as SEPARATE Strapi documents per language instead
 * of localizing one document (e.g. a pt-only "Notícias" category and an
 * en-only "News" category). A pairing pass detects those — pt-only and
 * en-only singles whose identity key matches — and fuses them into one record.
 * The absorbed document's id is kept in aliasImportIds so relation references
 * to it still resolve during import.
 *
 * Remaining single-locale documents get the existing locale copied into both
 * and are flagged for manual review.
 *
 * Usage: bun scripts/migrate/02-merge-locales.ts
 */
import { COLLECTIONS, nameToSlug, readJson, writeJson } from "./shared";

type Raw = Record<string, unknown> & { documentId: string };
type ExportFile = Record<string, Raw[]>;

interface MergedRecord {
  importId: string;
  aliasImportIds?: string[];
  published: boolean;
  pt: Raw | null;
  en: Raw | null;
}

/**
 * Identity key used to pair a pt-only document with its en-only twin.
 * Only defined for collections where a reliable cross-locale key exists.
 */
const PAIRING_KEYS: Record<string, (record: Raw) => string> = {
  authors: (record) => nameToSlug(String(record.name ?? "")),
  categories: (record) => `${record.type}:${record.slug}`,
  docs: (record) => `order:${record.order}`,
};

const warnings: string[] = [];

for (const config of COLLECTIONS) {
  const exportData = await readJson<ExportFile>(`${config.table}.json`);

  const merged: MergedRecord[] = [];

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

    const complete: MergedRecord[] = [];
    const ptOnly: MergedRecord[] = [];
    const enOnly: MergedRecord[] = [];

    for (const documentId of allIds) {
      const isPublished =
        publishedPt.has(documentId) || publishedEn.has(documentId);
      const pt = publishedPt.get(documentId) ?? draftPt.get(documentId) ?? null;
      const en = publishedEn.get(documentId) ?? draftEn.get(documentId) ?? null;
      const record: MergedRecord = {
        en,
        pt,
        published: isPublished,
        importId: documentId,
      };
      if (pt && en) {
        complete.push(record);
      } else if (pt) {
        ptOnly.push(record);
      } else {
        enOnly.push(record);
      }
    }

    // ── Pairing pass: fuse pt-only + en-only twins ──────────────────────────
    const paired = new Set<MergedRecord>();
    const keyOf = PAIRING_KEYS[config.table];
    if (keyOf && ptOnly.length > 0 && enOnly.length > 0) {
      const enByKey = new Map<string, MergedRecord[]>();
      for (const record of enOnly) {
        if (!record.en) {
          continue;
        }
        const key = keyOf(record.en);
        enByKey.set(key, [...(enByKey.get(key) ?? []), record]);
      }
      for (const ptRecord of ptOnly) {
        if (!ptRecord.pt) {
          continue;
        }
        const key = keyOf(ptRecord.pt);
        const candidates = enByKey.get(key) ?? [];
        // Only fuse an unambiguous 1:1 match
        if (candidates.length === 1 && !paired.has(candidates[0])) {
          const enRecord = candidates[0];
          warnings.push(
            `${config.table}: paired split documents ${ptRecord.importId} (pt) + ${enRecord.importId} (en) — key "${key}"`
          );
          complete.push({
            importId: ptRecord.importId,
            aliasImportIds: [enRecord.importId],
            published: ptRecord.published || enRecord.published,
            pt: ptRecord.pt,
            en: enRecord.en,
          });
          paired.add(ptRecord);
          paired.add(enRecord);
        }
      }
    }

    // ── Remaining true singles: copy the existing locale, flag ──────────────
    const singles = [...ptOnly, ...enOnly].filter(
      (record) => !paired.has(record)
    );
    for (const record of singles) {
      if (!record.en && record.pt) {
        warnings.push(
          `${config.table}/${record.importId}: missing en — copied pt`
        );
        record.en = record.pt;
      }
      if (!record.pt && record.en) {
        warnings.push(
          `${config.table}/${record.importId}: missing pt — copied en`
        );
        record.pt = record.en;
      }
      complete.push(record);
    }

    merged.push(...complete);
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
