/** Column and platform definitions shared by the kanban pages and editors. */

export interface BoardColumn {
  key: string;
  label: string;
}

export const IDEA_COLUMNS: BoardColumn[] = [
  { key: "draft", label: "Rascunho" },
  { key: "pending", label: "Pendente" },
  { key: "approved", label: "Aprovada" },
  { key: "recorded", label: "Gravada" },
  { key: "edited", label: "Editada" },
  { key: "posted", label: "Publicada" },
];

export const PLATFORMS = [
  { key: "youtube", label: "YouTube" },
  { key: "tiktok", label: "TikTok" },
  { key: "instagram", label: "Instagram" },
  { key: "x", label: "X" },
];

export const TASK_COLUMNS: BoardColumn[] = [
  { key: "backlog", label: "Backlog" },
  { key: "todo", label: "A Fazer" },
  { key: "in_progress", label: "Em Progresso" },
  { key: "in_review", label: "Em Revisão" },
  { key: "done", label: "Concluída" },
];

export interface BoardCard {
  _id: string;
  order: number;
  status: string;
}

export interface IdeaDoc extends BoardCard {
  categoryId?: string;
  createdAt: number;
  description: string;
  platforms: string[];
  title: string;
  updatedAt: number;
}

export interface TaskDoc extends BoardCard {
  assigneeId?: string;
  createdAt: number;
  description?: string;
  dueDate?: string;
  title: string;
  updatedAt: number;
}

export interface CategoryDoc {
  _id: string;
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

/** Float order for appending to the end of a column. */
export function appendOrder(cards: BoardCard[], status: string): number {
  const max = cards
    .filter((c) => c.status === status)
    .reduce((acc, c) => Math.max(acc, c.order), 0);
  return max + 1000;
}
