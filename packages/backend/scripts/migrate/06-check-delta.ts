/**
 * Delta check: diff current Strapi content against the scratch/export/*.json
 * snapshot taken by 01-export.ts. Reports entries created, modified, or
 * deleted since that export — i.e. whether the migration scripts need a
 * re-run before cutover. Read-only; changes nothing in Strapi or Convex.
 *
 * Usage: STRAPI_URL=... STRAPI_SECRET_KEY=... bun scripts/migrate/06-check-delta.ts
 * Exit code 0 = in sync, 1 = delta found (re-run 01→05).
 */
import { COLLECTIONS, pullAll, readJson, strapiFetch } from "./shared";

function str(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function recordId(record: Record<string, unknown>): string {
  return str(record.documentId) ?? String(record.id);
}

function label(record: Record<string, unknown>): string {
  return (
    str(record.title) ??
    str(record.name) ??
    str(record.question) ??
    str(record.email) ??
    str(record.location) ??
    recordId(record)
  );
}

interface Change {
  kind: "new" | "modified" | "deleted";
  key: string;
  id: string;
  label: string;
  updatedAt?: string;
}

function diff(
  key: string,
  snapshot: Record<string, unknown>[],
  current: Record<string, unknown>[]
): Change[] {
  const changes: Change[] = [];
  const snapshotById = new Map(
    snapshot.map((record) => [recordId(record), record])
  );
  const currentIds = new Set<string>();
  for (const record of current) {
    const id = recordId(record);
    currentIds.add(id);
    const old = snapshotById.get(id);
    if (!old) {
      changes.push({
        id,
        key,
        kind: "new",
        label: label(record),
        updatedAt: str(record.updatedAt),
      });
    } else if (str(old.updatedAt) !== str(record.updatedAt)) {
      changes.push({
        id,
        key,
        kind: "modified",
        label: label(record),
        updatedAt: str(record.updatedAt),
      });
    }
  }
  for (const record of snapshot) {
    const id = recordId(record);
    if (!currentIds.has(id)) {
      changes.push({ id, key, kind: "deleted", label: label(record) });
    }
  }
  return changes;
}

let totalChanges = 0;

for (const config of COLLECTIONS) {
  const snapshot = await readJson<Record<string, Record<string, unknown>[]>>(
    `${config.table}.json`
  );
  const locales = config.localized ? ["pt", "en"] : [undefined];
  const statuses: ("draft" | undefined)[] = config.draftAndPublish
    ? [undefined, "draft"]
    : [undefined];

  const changes: Change[] = [];
  for (const locale of locales) {
    for (const status of statuses) {
      const key = `${locale ?? "all"}${status === "draft" ? "-draft" : ""}`;
      const current = await pullAll(config, { locale, status });
      changes.push(...diff(key, snapshot[key] ?? [], current));
    }
  }

  if (changes.length === 0) {
    console.log(`${config.table}: in sync`);
  } else {
    totalChanges += changes.length;
    console.log(`${config.table}: ${changes.length} change(s)`);
    for (const change of changes) {
      const when = change.updatedAt ? ` @ ${change.updatedAt}` : "";
      console.log(
        `  [${change.kind}] (${change.key}) ${change.label} — ${change.id}${when}`
      );
    }
  }
}

// Media manifest diff (new/removed upload files since the export)
interface UploadFile {
  id: number;
  name: string;
  updatedAt?: string;
}
const snapshotFiles = await readJson<UploadFile[]>("_media-manifest.json");
const currentFiles: UploadFile[] = [];
let page = 1;
for (;;) {
  const res = await strapiFetch<UploadFile[]>(
    `/api/upload/files?pagination[pageSize]=100&pagination[page]=${page}`
  );
  const batch = Array.isArray(res) ? res : [];
  currentFiles.push(...batch);
  if (batch.length < 100) {
    break;
  }
  page += 1;
}
const snapshotFileIds = new Set(snapshotFiles.map((file) => file.id));
const currentFileIds = new Set(currentFiles.map((file) => file.id));
const newFiles = currentFiles.filter((file) => !snapshotFileIds.has(file.id));
const goneFiles = snapshotFiles.filter((file) => !currentFileIds.has(file.id));
if (newFiles.length === 0 && goneFiles.length === 0) {
  console.log("media: in sync");
} else {
  totalChanges += newFiles.length + goneFiles.length;
  console.log(`media: ${newFiles.length} new, ${goneFiles.length} removed`);
  for (const file of newFiles) {
    console.log(`  [new] ${file.name} — id ${file.id}`);
  }
  for (const file of goneFiles) {
    console.log(`  [deleted] ${file.name} — id ${file.id}`);
  }
}

if (totalChanges === 0) {
  console.log("\nNo delta. Convex matches the export snapshot's source data.");
} else {
  console.log(
    `\n${totalChanges} change(s) since export. Re-run 01-export → 05-verify (import is idempotent).`
  );
  process.exitCode = 1;
}
