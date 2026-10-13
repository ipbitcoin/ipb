/** Column, card and ordering definitions shared by the board pages. */

import type { LabelColor } from "./palette";

/**
 * A status's icon, after Linear's: a dashed ring before the work is picked
 * up, a ring filling up as it moves along, and a disc once it's done.
 */
export interface StatusIcon {
  shape: "dashed" | "ring" | "done";
  /** How far along the ring is filled, from 0 to 1. */
  fill?: number;
  tone: string;
}

export interface BoardColumn {
  key: string;
  label: string;
  icon: StatusIcon;
  /** Finished work: dates on its cards are no longer overdue. */
  closed?: boolean;
}

const MUTED = "text-neutral-400";
const OPEN = "text-neutral-600";
const MOVING = "text-yellow-500";
const REVIEW = "text-green-500";
const DONE = "text-blue-500";

export const IDEA_COLUMNS: BoardColumn[] = [
  { icon: { shape: "dashed", tone: MUTED }, key: "draft", label: "Rascunho" },
  { icon: { shape: "ring", tone: OPEN }, key: "pending", label: "Pendente" },
  {
    icon: { fill: 0.25, shape: "ring", tone: MOVING },
    key: "approved",
    label: "Aprovada",
  },
  {
    icon: { fill: 0.5, shape: "ring", tone: MOVING },
    key: "recorded",
    label: "Gravada",
  },
  {
    icon: { fill: 0.75, shape: "ring", tone: REVIEW },
    key: "edited",
    label: "Editada",
  },
  {
    closed: true,
    icon: { shape: "done", tone: DONE },
    key: "posted",
    label: "Publicada",
  },
];

export const TASK_COLUMNS: BoardColumn[] = [
  { icon: { shape: "dashed", tone: MUTED }, key: "backlog", label: "Backlog" },
  { icon: { shape: "ring", tone: OPEN }, key: "todo", label: "A Fazer" },
  {
    icon: { fill: 0.5, shape: "ring", tone: MOVING },
    key: "in_progress",
    label: "Em Progresso",
  },
  {
    icon: { fill: 0.75, shape: "ring", tone: REVIEW },
    key: "in_review",
    label: "Em Revisão",
  },
  {
    closed: true,
    icon: { shape: "done", tone: DONE },
    key: "done",
    label: "Concluída",
  },
];

const UNKNOWN_STATUS: StatusIcon = { shape: "ring", tone: "text-neutral-400" };

/** The icon of a status, plain for one no column knows. */
export function statusIcon(columns: BoardColumn[], key: string): StatusIcon {
  return columns.find((column) => column.key === key)?.icon ?? UNKNOWN_STATUS;
}

/** A column per status, or rows grouped by status. */
export const BOARD_LAYOUTS = ["kanban", "list"] as const;

export type BoardLayout = (typeof BOARD_LAYOUTS)[number];

export function isBoardLayout(value: string): value is BoardLayout {
  return BOARD_LAYOUTS.some((layout) => layout === value);
}

export const PLATFORMS = [
  { key: "youtube", label: "YouTube" },
  { key: "tiktok", label: "TikTok" },
  { key: "instagram", label: "Instagram" },
  { key: "x", label: "X" },
];

export function platformLabel(key: string): string {
  return PLATFORMS.find((p) => p.key === key)?.label ?? key;
}

export interface BoardCard {
  _id: string;
  order: number;
  status: string;
  title: string;
}

export interface IdeaDoc extends BoardCard {
  createdAt: number;
  description: string;
  labelIds?: string[];
  platforms: string[];
  updatedAt: number;
}

export interface TaskDoc extends BoardCard {
  assigneeId?: string;
  createdAt: number;
  description?: string;
  dueDate?: string;
  updatedAt: number;
}

export interface IdeaLabel {
  _id: string;
  color: LabelColor;
  name: string;
}

export interface AdminUser {
  _id: string;
  avatarKey?: string;
  email: string;
  name?: string;
  username?: string;
}

/** Display name for an admin: username, else name, else email. */
export function adminLabel(admin: AdminUser): string {
  return admin.username ?? admin.name ?? admin.email;
}

/** Cards per column, in order; any in a status no column has stay out. */
export function groupByColumn<T extends BoardCard>(
  columns: BoardColumn[],
  cards: T[]
): Record<string, T[]> {
  const groups = Object.fromEntries(
    columns.map((column): [string, T[]] => [column.key, []])
  );
  for (const card of cards.toSorted((a, b) => a.order - b.order)) {
    groups[card.status]?.push(card);
  }
  return groups;
}

/** Where a card lands: its column and its order within it. */
export interface CardMove {
  id: string;
  order: number;
  status: string;
}

const ORDER_STEP = 1000;

/** An order between two neighbours; either may be missing at a column's ends. */
export function orderBetween(before?: number, after?: number): number {
  if (before !== undefined && after !== undefined) {
    return (before + after) / 2;
  }
  if (before !== undefined) {
    return before + ORDER_STEP;
  }
  if (after !== undefined) {
    return after - ORDER_STEP;
  }
  return ORDER_STEP;
}

/** Float order for appending to the end of a column. */
export function appendOrder(cards: BoardCard[], status: string): number {
  const orders = cards.filter((c) => c.status === status).map((c) => c.order);
  return orders.length > 0 ? orderBetween(Math.max(...orders)) : orderBetween();
}

/**
 * The moves that put the card at `index` of a column in place. Usually just
 * that card; when its neighbours leave no room between them, the whole column
 * is spaced out again.
 */
export function placeCard(
  cards: BoardCard[],
  index: number,
  status: string
): CardMove[] {
  const card = cards[index];
  if (!card) {
    return [];
  }
  const before = cards[index - 1]?.order;
  const after = cards[index + 1]?.order;
  const order = orderBetween(before, after);
  if (
    (before === undefined || before < order) &&
    (after === undefined || order < after)
  ) {
    return [{ id: card._id, order, status }];
  }
  return cards.flatMap((item, position) => {
    const spaced = (position + 1) * ORDER_STEP;
    return item === card || item.order !== spaced
      ? [{ id: item._id, order: spaced, status }]
      : [];
  });
}

/** Today as "YYYY-MM-DD", in local time. */
export function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function isOverdue(
  dueDate: string | undefined,
  closed = false
): boolean {
  return Boolean(dueDate) && !closed && String(dueDate) < todayIso();
}

const MONTH = new Intl.DateTimeFormat("pt-PT", { month: "short" });

/** "1 out": the day and the month's short name. */
export function formatDueDate(dueDate: string): string {
  const date = new Date(`${dueDate}T00:00:00`);
  return `${date.getDate()} ${MONTH.format(date).replace(".", "")}`;
}
