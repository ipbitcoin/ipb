/** Config-driven admin: field definitions per collection. */

import type { TableColumn } from "./table";

export type FieldType =
  | "text" // plain string
  | "textarea"
  | "number"
  | "boolean"
  | "datetime" // ISO string
  | "select" // one of options
  | "locText" // { pt, en } single-line
  | "locTextarea" // { pt, en } multi-line
  | "locMarkdown" // { pt, en } markdown with preview
  | "media" // single R2 key
  | "locMedia" // { pt, en } R2 keys (per-locale file)
  | "relation" // id of another collection
  | "multiRelation"; // array of ids

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[]; // for select
  relationTo?: string; // for relation/multiRelation
  relationLabelField?: string; // field on the related doc used as display label
  accept?: string; // media input accept attribute
  hint?: string;
}

export interface CollectionDef {
  table: string;
  label: string;
  readOnly?: boolean;
  /** Records come from elsewhere: `fields` can be edited, but none created or deleted. */
  editOnly?: boolean;
  /** fields shown in the list table (dot access into the raw doc; `.pt` for localized) */
  listFields: TableColumn[];
  fields: FieldDef[];
}

export const COLLECTIONS: Record<string, CollectionDef> = {
  articles: {
    fields: [
      { key: "title", label: "Título", type: "locText", required: true },
      { key: "slug", label: "Slug", type: "locText", required: true },
      {
        key: "content",
        label: "Conteúdo",
        type: "locMarkdown",
        required: true,
      },
      {
        key: "readTime",
        label: "Tempo de leitura (min)",
        type: "number",
        required: true,
      },
      {
        key: "mainImageKey",
        label: "Imagem principal",
        type: "media",
        required: true,
        accept: "image/*",
      },
      {
        key: "audioKey",
        label: "Áudio (por língua)",
        type: "locMedia",
        accept: "audio/*",
      },
      {
        key: "categoryId",
        label: "Categoria",
        type: "relation",
        relationTo: "categories",
        relationLabelField: "name.pt",
      },
      {
        key: "authorIds",
        label: "Autores",
        type: "multiRelation",
        relationTo: "authors",
        relationLabelField: "name",
      },
      { key: "published", label: "Publicado", type: "boolean" },
    ],
    label: "Artigos",
    listFields: [
      { key: "mainImageKey", kind: "media", label: "Imagem" },
      { key: "title.pt", label: "Título" },
      { key: "slug.pt", label: "Slug" },
      { key: "published", kind: "boolean", label: "Publicado" },
    ],
    table: "articles",
  },
  authors: {
    fields: [
      { key: "name", label: "Nome", type: "text", required: true },
      {
        key: "slug",
        label: "Slug",
        type: "text",
        required: true,
        hint: "minúsculas-com-hífens",
      },
      { key: "description", label: "Descrição", type: "locTextarea" },
      {
        key: "pictureKey",
        label: "Fotografia",
        type: "media",
        required: true,
        accept: "image/*",
      },
      { key: "linkedin", label: "LinkedIn", type: "text" },
      { key: "published", label: "Publicado", type: "boolean" },
    ],
    label: "Autores",
    listFields: [
      { key: "pictureKey", kind: "media", label: "Fotografia" },
      { key: "name", label: "Nome" },
      { key: "slug", label: "Slug" },
      { key: "published", kind: "boolean", label: "Publicado" },
    ],
    table: "authors",
  },
  books: {
    fields: [
      { key: "title", label: "Título", type: "locText", required: true },
      { key: "author", label: "Autor", type: "locText", required: true },
      { key: "description", label: "Descrição", type: "locTextarea" },
      { key: "pages", label: "Páginas", type: "number" },
      { key: "year", label: "Ano", type: "number" },
      { key: "coverKey", label: "Capa", type: "media", accept: "image/*" },
      { key: "url", label: "URL", type: "text" },
      { key: "active", label: "Ativo", type: "boolean" },
      {
        key: "publisherId",
        label: "Editora",
        type: "relation",
        relationTo: "publishers",
        relationLabelField: "name",
      },
      { key: "published", label: "Publicado", type: "boolean" },
    ],
    label: "Livros",
    listFields: [
      { key: "coverKey", kind: "media", label: "Capa" },
      { key: "title.pt", label: "Título" },
      { key: "author.pt", label: "Autor" },
      { key: "active", kind: "boolean", label: "Ativo" },
      { key: "published", kind: "boolean", label: "Publicado" },
    ],
    table: "books",
  },
  categories: {
    fields: [
      { key: "name", label: "Nome", type: "locText", required: true },
      { key: "slug", label: "Slug", type: "locText", required: true },
      {
        key: "type",
        label: "Tipo",
        type: "select",
        options: ["research", "education", "news"],
        required: true,
      },
    ],
    label: "Categorias",
    listFields: [
      { key: "name.pt", label: "Nome" },
      { key: "slug.pt", label: "Slug" },
      { key: "type", label: "Tipo" },
    ],
    table: "categories",
  },
  docs: {
    fields: [
      { key: "title", label: "Título", type: "locText", required: true },
      { key: "description", label: "Descrição", type: "locTextarea" },
      {
        key: "documentKey",
        label: "Ficheiro (por língua)",
        type: "locMedia",
        required: true,
      },
      { key: "order", label: "Ordem", type: "number", required: true },
      { key: "published", label: "Publicado", type: "boolean" },
    ],
    label: "Documentos",
    listFields: [
      { key: "title.pt", label: "Título" },
      { key: "order", kind: "number", label: "Ordem" },
      { key: "published", kind: "boolean", label: "Publicado" },
    ],
    table: "docs",
  },
  enrollments: {
    fields: [],
    label: "Inscrições",
    listFields: [
      { key: "name", label: "Nome" },
      { key: "email", label: "Email" },
      { key: "paymentStatus", kind: "badge", label: "Pagamento" },
      { key: "orderId", label: "Encomenda" },
      { key: "value", kind: "money", label: "Valor" },
    ],
    readOnly: true,
    table: "enrollments",
  },
  faqs: {
    fields: [
      { key: "question", label: "Pergunta", type: "locText", required: true },
      { key: "answer", label: "Resposta", type: "locTextarea", required: true },
      { key: "order", label: "Ordem", type: "number", required: true },
      { key: "published", label: "Publicado", type: "boolean" },
    ],
    label: "FAQs",
    listFields: [
      { key: "question.pt", label: "Pergunta" },
      { key: "order", kind: "number", label: "Ordem" },
      { key: "published", kind: "boolean", label: "Publicado" },
    ],
    table: "faqs",
  },
  members: {
    editOnly: true,
    fields: [
      {
        key: "whatsapp",
        label: "WhatsApp",
        type: "text",
        hint: "Número ou nome do perfil",
      },
      { key: "telegram", label: "Telegram", type: "text", hint: "@utilizador" },
      { key: "notes", label: "Notas internas", type: "textarea" },
    ],
    label: "Membros",
    listFields: [
      { key: "name", label: "Nome" },
      { key: "email", label: "Email" },
      { key: "layer", label: "Camada" },
      { key: "feeEur", kind: "money", label: "Quota" },
      { key: "paymentPlan", kind: "badge", label: "Período" },
      { key: "paymentStatus", kind: "badge", label: "Estado" },
      { key: "whatsapp", label: "WhatsApp" },
      { key: "telegram", label: "Telegram" },
    ],
    table: "members",
  },
  newsletters: {
    fields: [],
    label: "Newsletter",
    listFields: [
      { key: "email", label: "Email" },
      { key: "name", label: "Nome" },
    ],
    readOnly: true,
    table: "newsletters",
  },
  partners: {
    fields: [
      { key: "name", label: "Nome", type: "text", required: true },
      {
        key: "logoKey",
        label: "Logo",
        type: "media",
        required: true,
        accept: "image/*",
      },
      { key: "link", label: "Link", type: "text" },
      { key: "order", label: "Ordem", type: "number", required: true },
      { key: "published", label: "Publicado", type: "boolean" },
    ],
    label: "Parceiros",
    listFields: [
      { key: "logoKey", kind: "media", label: "Logo" },
      { key: "name", label: "Nome" },
      { key: "order", kind: "number", label: "Ordem" },
      { key: "published", kind: "boolean", label: "Publicado" },
    ],
    table: "partners",
  },
  publishers: {
    fields: [
      { key: "name", label: "Nome", type: "text", required: true },
      { key: "slug", label: "Slug", type: "text", required: true },
      { key: "website", label: "Website", type: "text" },
      { key: "description", label: "Descrição", type: "textarea" },
    ],
    label: "Editoras",
    listFields: [
      { key: "name", label: "Nome" },
      { key: "slug", label: "Slug" },
    ],
    table: "publishers",
  },
  teamMembers: {
    fields: [
      { key: "name", label: "Nome", type: "text", required: true },
      { key: "role", label: "Função", type: "locText", required: true },
      {
        key: "description",
        label: "Descrição",
        type: "locTextarea",
        required: true,
      },
      { key: "order", label: "Ordem", type: "number", required: true },
      {
        key: "pictureKey",
        label: "Fotografia",
        type: "media",
        required: true,
        accept: "image/*",
      },
      { key: "linkedin", label: "LinkedIn", type: "text" },
      { key: "nostr", label: "Nostr", type: "text" },
      { key: "published", label: "Publicado", type: "boolean" },
    ],
    label: "Equipa",
    listFields: [
      { key: "pictureKey", kind: "media", label: "Fotografia" },
      { key: "name", label: "Nome" },
      { key: "role.pt", label: "Função" },
      { key: "order", kind: "number", label: "Ordem" },
      { key: "published", kind: "boolean", label: "Publicado" },
    ],
    table: "teamMembers",
  },
  trainings: {
    fields: [
      {
        key: "startDate",
        label: "Início (ISO)",
        type: "datetime",
        required: true,
      },
      { key: "endDate", label: "Fim (ISO)", type: "datetime" },
      { key: "location", label: "Local", type: "locText", required: true },
      { key: "locationUrl", label: "URL do local", type: "text" },
      { key: "stock", label: "Vagas totais", type: "number", required: true },
      {
        key: "stockLeft",
        label: "Vagas restantes",
        type: "number",
        required: true,
      },
      { key: "active", label: "Ativa", type: "boolean" },
      { key: "published", label: "Publicada", type: "boolean" },
    ],
    label: "Formações",
    listFields: [
      { key: "startDate", kind: "date", label: "Início" },
      { key: "location.pt", label: "Local" },
      { key: "stockLeft", kind: "number", label: "Vagas" },
      { key: "active", kind: "boolean", label: "Ativa" },
    ],
    table: "trainings",
  },
  values: {
    fields: [
      { key: "title", label: "Título", type: "locText", required: true },
      {
        key: "description",
        label: "Descrição",
        type: "locTextarea",
        required: true,
      },
      { key: "order", label: "Ordem", type: "number", required: true },
      { key: "published", label: "Publicado", type: "boolean" },
    ],
    label: "Valores",
    listFields: [
      { key: "title.pt", label: "Título" },
      { key: "order", kind: "number", label: "Ordem" },
      { key: "published", kind: "boolean", label: "Publicado" },
    ],
    table: "values",
  },
};

export function getByPath(obj: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (acc, part) =>
        acc && typeof acc === "object" ? Reflect.get(acc, part) : undefined,
      obj
    );
}
