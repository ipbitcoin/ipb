/** How a table cell shows its value. */
export type CellKind =
  | "text"
  | "number"
  | "money" // euros
  | "boolean"
  | "badge" // a known value as a colored pill, see BADGES
  | "date" // ISO date or datetime
  | "media"; // R2 key of an image, as a thumbnail

/** Column definition consumed by `AdminTable`. */
export interface TableColumn {
  key: string;
  label: string;
  /** Plain text when left out. */
  kind?: CellKind;
}

type Tone = "green" | "amber" | "red" | "neutral";

/** Known enum values, named in Portuguese and colored by what they mean. */
const BADGES: Record<string, { label: string; tone: Tone }> = {
  active: { label: "Ativo", tone: "green" },
  cancelled: { label: "Cancelado", tone: "neutral" },
  expired: { label: "Expirado", tone: "neutral" },
  failed: { label: "Falhou", tone: "red" },
  monthly: { label: "Mensal", tone: "neutral" },
  paid: { label: "Pago", tone: "green" },
  pending: { label: "Pendente", tone: "amber" },
  yearly: { label: "Anual", tone: "neutral" },
};

const TONES: Record<Tone, { pill: string; dot: string }> = {
  amber: { dot: "bg-amber-500", pill: "bg-amber-500/12 text-amber-800" },
  green: { dot: "bg-green-500", pill: "bg-green-500/12 text-green-800" },
  neutral: { dot: "bg-neutral-400", pill: "bg-neutral-950/5 text-neutral-700" },
  red: { dot: "bg-red-500", pill: "bg-red-500/12 text-red-800" },
};

export function badgeOf(value: unknown): {
  label: string;
  pill: string;
  dot: string;
} {
  const text = String(value ?? "");
  const badge = BADGES[text] ?? { label: text, tone: "neutral" };
  return { label: badge.label, ...TONES[badge.tone] };
}

/** Whether the column's values line up on the right, as figures do. */
export function isNumeric(column: TableColumn): boolean {
  return column.kind === "number" || column.kind === "money";
}

const money = new Intl.NumberFormat("pt-PT", {
  currency: "EUR",
  style: "currency",
});

export function formatMoney(value: unknown): string {
  return typeof value === "number" ? money.format(value) : "";
}

/** "12 out 2026", with the time when there is one. */
export function formatDate(value: unknown): string {
  if (typeof value !== "string" || !value) {
    return "";
  }
  const hasTime = value.includes("T");
  const date = new Date(hasTime ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("pt-PT", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(hasTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

/** What a cell reads as, for searching it. */
export function cellText(column: TableColumn, value: unknown): string {
  switch (column.kind) {
    case "badge": {
      return value == null ? "" : badgeOf(value).label;
    }
    case "date": {
      return formatDate(value);
    }
    case "media":
    case "boolean": {
      return "";
    }
    default: {
      return value == null ? "" : String(value);
    }
  }
}

const collator = new Intl.Collator("pt-PT", {
  numeric: true,
  sensitivity: "base",
});

/** Orders two cell values: empty last, then figures, flags, and text. */
export function compareCells(a: unknown, b: unknown): number {
  const emptyA = a == null || a === "";
  const emptyB = b == null || b === "";
  if (emptyA || emptyB) {
    return Number(emptyA) - Number(emptyB);
  }
  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }
  if (typeof a === "boolean" && typeof b === "boolean") {
    return Number(b) - Number(a);
  }
  return collator.compare(String(a), String(b));
}
