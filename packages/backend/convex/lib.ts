import { v } from "convex/values";

// Convex runtime exposes env vars via process.env inside its V8 isolate.
declare const process: { env: Record<string, string | undefined> };

export const localeArg = v.union(v.literal("pt"), v.literal("en"));

/**
 * Swatches a board label can wear, in palette order; the admin maps each to
 * its classes. Also read by the admin's MCP tools (via `@ipb/backend/lib`).
 */
export const LABEL_COLORS = [
  "gray",
  "blue",
  "green",
  "yellow",
  "orange",
  "red",
  "pink",
  "purple",
  "teal",
] as const;

export const labelColor = v.union(
  ...LABEL_COLORS.map((color) => v.literal(color))
);

/** The tasks board's columns, in order. */
export const TASK_STATUSES = [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "done",
] as const;

export const taskStatus = v.union(
  ...TASK_STATUSES.map((status) => v.literal(status))
);
export type Locale = "pt" | "en";

export interface LocalizedString {
  pt: string;
  en: string;
}
export interface LocalizedOptional {
  pt?: string;
  en?: string;
}

/** Resolve a localized field to the requested locale, falling back to the other. */
export function pick(field: LocalizedString, locale: Locale): string {
  return field[locale] || field[locale === "pt" ? "en" : "pt"];
}

export function pickOpt(
  field: LocalizedOptional | undefined,
  locale: Locale
): string | undefined {
  if (!field) {
    return undefined;
  }
  return field[locale] ?? field[locale === "pt" ? "en" : "pt"];
}

/** Absolute public URL for an R2 object, served via the CDN custom domain. */
export function mediaUrl(key: string): string {
  const host = process.env.CDN_HOST ?? "cdn.institutobitcoin.pt";
  return `https://${host}/${key}`;
}

/** Guard for service (admin/webhook) functions. Throws unless key matches. */
export function assertServiceKey(serviceKey: string): void {
  const expected = process.env.SERVICE_KEY;
  if (!expected || serviceKey !== expected) {
    throw new Error("Invalid service key");
  }
}
