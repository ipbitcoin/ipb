import { COLLECTIONS } from "./collections";

export interface NavItem {
  label: string;
  to: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
  defaultCollapsed?: boolean;
}

export const NAV_SECTIONS: NavSection[] = [
  {
    defaultCollapsed: true,
    items: Object.entries(COLLECTIONS)
      .filter(([key]) => key !== "ideaCategories")
      .map(([key, def]) => ({ label: def.label, to: `/c/${key}` })),
    label: "Coleções",
  },
  {
    items: [
      { label: "Ideias", to: "/social" },
      { label: "Categorias", to: "/c/ideaCategories" },
    ],
    label: "Redes Sociais",
  },
  {
    items: [{ label: "Quadro", to: "/tasks" }],
    label: "Tarefas",
  },
];
