import { ConvexError, v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { assertServiceKey, LABEL_COLORS, labelColor, taskStatus } from "./lib";

/**
 * What the admin's MCP tools read and change on the tasks board. The admin
 * app's MCP server (apps/admin/server/routes/mcp.ts) checks an app's token and
 * calls these with the grant it stands for; each checks that grant again, in
 * the same transaction as its work. Refusals are ConvexErrors written for the
 * model, so it can put its call right. The social media board's tools
 * (mcpIdeas.ts) share the helpers exported here.
 */

type Status = Doc<"tasks">["status"];
type Color = Doc<"taskCategories">["color"];

/** The board's columns, in order, with the names people see. */
const STATUSES: { key: Status; label: string }[] = [
  { key: "backlog", label: "Backlog" },
  { key: "todo", label: "A Fazer" },
  { key: "in_progress", label: "Em Progresso" },
  { key: "in_review", label: "Em Revisão" },
  { key: "done", label: "Concluída" },
];

/** The admin board spaces cards this far apart in a column. */
export const ORDER_STEP = 1000;
/** Most tasks list_tasks returns at once. */
const MAX_TASKS = 200;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/u;

export const grantArgs = { grantId: v.id("mcpGrants"), serviceKey: v.string() };

export function refuse(message: string): ConvexError<string> {
  return new ConvexError(message);
}

/** The admin the app acts as, once the grant is known good for the call. */
export async function actorOf(
  ctx: QueryCtx,
  serviceKey: string,
  grantId: Id<"mcpGrants">,
  write: boolean
): Promise<Doc<"adminUsers">> {
  assertServiceKey(serviceKey);
  const grant = await ctx.db.get(grantId);
  const admin = grant && (await ctx.db.get(grant.adminId));
  if (!(grant && admin?.active)) {
    throw refuse("This app was disconnected. Connect it again.");
  }
  if (write && !grant.write) {
    throw refuse("This app was only allowed to read.");
  }
  return admin;
}

/** For matching names: no case, accents or surrounding space. */
export function fold(text: string): string {
  return text
    .normalize("NFD")
    .replaceAll(/\p{M}/gu, "")
    .trim()
    .toLocaleLowerCase("pt-PT");
}

export function personName(admin: Doc<"adminUsers">): string {
  return admin.username ?? admin.name ?? admin.email;
}

/**
 * The one item a name stands for, or a refusal naming the choices. A name as
 * written (any case) wins over one that only matches without accents, so
 * "Revisão" and "Revisao" can both be named.
 */
export function pickOne<T>(
  ref: string,
  items: T[],
  keys: (item: T) => (string | undefined)[],
  name: (item: T) => string,
  what: string,
  hint: string
): T {
  const matching = (same: (key: string) => boolean) =>
    items.filter((item) =>
      keys(item).some((key) => key !== undefined && same(key))
    );
  const lower = (text: string) => text.trim().toLocaleLowerCase("pt-PT");
  const exact = matching((key) => lower(key) === lower(ref));
  const found =
    exact.length > 0 ? exact : matching((key) => fold(key) === fold(ref));
  const [only, other] = found;
  if (only && !other) {
    return only;
  }
  if (only) {
    throw refuse(
      `"${ref}" is more than one ${what}: ${found.map(name).join(", ")}. Use one of those.`
    );
  }
  throw refuse(`There's no ${what} "${ref}". ${hint}`);
}

/** Someone tasks can go to, by username, name, email or id; "me" is the actor. */
async function findPerson(
  ctx: QueryCtx,
  ref: string,
  me: Doc<"adminUsers">
): Promise<Doc<"adminUsers">> {
  if (fold(ref) === "me") {
    return me;
  }
  const admins = await ctx.db.query("adminUsers").collect();
  return pickOne(
    ref.replace(/^\s*@/u, ""),
    admins.filter((admin) => admin.active),
    (admin) => [admin._id, admin.username, admin.name, admin.email],
    personName,
    "person",
    "get_board lists the people tasks can go to."
  );
}

async function allCategories(ctx: QueryCtx): Promise<Doc<"taskCategories">[]> {
  return await ctx.db
    .query("taskCategories")
    .withIndex("by_name")
    .order("asc")
    .collect();
}

/** Categories by name, in the board's order; unknown ones are refused. */
async function findCategories(
  ctx: QueryCtx,
  names: string[]
): Promise<Id<"taskCategories">[]> {
  const categories = await allCategories(ctx);
  const picked = new Set(
    names.map(
      (ref) =>
        pickOne(
          ref,
          categories,
          (category) => [category.name],
          (category) => category.name,
          "category",
          "get_board lists the categories; create_category adds one."
        )._id
    )
  );
  return categories
    .map((category) => category._id)
    .filter((id) => picked.has(id));
}

function taskIdOf(ctx: QueryCtx, ref: string): Id<"tasks"> {
  const id = ctx.db.normalizeId("tasks", ref.trim());
  if (!id) {
    throw refuse(`There's no task with id ${ref}. list_tasks shows them.`);
  }
  return id;
}

async function findTask(ctx: QueryCtx, ref: string): Promise<Doc<"tasks">> {
  const task = await ctx.db.get(taskIdOf(ctx, ref));
  if (!task) {
    throw refuse(`There's no task with id ${ref}. list_tasks shows them.`);
  }
  return task;
}

function checkDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (
    !ISO_DATE.test(date) ||
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date
  ) {
    throw refuse(`"${date}" isn't a date. Use YYYY-MM-DD.`);
  }
  return date;
}

function cleanTitle(title: string): string {
  const clean = title.trim();
  if (!clean) {
    throw refuse("A task needs a title.");
  }
  return clean;
}

/** The order that puts a task last in a column, as the admin board does. */
async function endOrder(ctx: QueryCtx, status: Status): Promise<number> {
  const last = await ctx.db
    .query("tasks")
    .withIndex("by_status_order", (q) => q.eq("status", status))
    .order("desc")
    .first();
  return last ? last.order + ORDER_STEP : ORDER_STEP;
}

/** What tasks are shown with: the people and categories they name. */
interface Lookup {
  categories: Doc<"taskCategories">[];
  people: Map<Id<"adminUsers">, Doc<"adminUsers">>;
}

async function lookupOf(ctx: QueryCtx): Promise<Lookup> {
  const [admins, categories] = await Promise.all([
    ctx.db.query("adminUsers").collect(),
    allCategories(ctx),
  ]);
  return {
    categories,
    people: new Map(admins.map((admin) => [admin._id, admin])),
  };
}

/** A task as tools show it. */
function viewOf(task: Doc<"tasks">, lookup: Lookup) {
  const assignee = task.assigneeId && lookup.people.get(task.assigneeId);
  const ids = new Set(task.categoryIds);
  return {
    assignee: assignee ? personName(assignee) : null,
    categories: lookup.categories
      .filter((category) => ids.has(category._id))
      .map((category) => category.name),
    description: task.description ?? null,
    due_date: task.dueDate ?? null,
    id: task._id,
    status: task.status,
    title: task.title,
    updated_at: new Date(task.updatedAt).toISOString(),
  };
}

async function shown(ctx: QueryCtx, taskId: Id<"tasks">) {
  const task = await ctx.db.get(taskId);
  return task ? viewOf(task, await lookupOf(ctx)) : null;
}

/** A new label's color: whichever the fewest wear, so they stay told apart. */
export function nextColor(labels: { color: Color }[]): Color {
  const uses = (color: Color) =>
    labels.filter((label) => label.color === color).length;
  const [color = "blue"] = LABEL_COLORS.filter(
    (item) => item !== "gray"
  ).toSorted((a, b) => uses(a) - uses(b));
  return color;
}

// Reading

export const board = query({
  args: grantArgs,
  handler: async (ctx, args) => {
    const me = await actorOf(ctx, args.serviceKey, args.grantId, false);
    const [tasks, lookup] = await Promise.all([
      ctx.db.query("tasks").collect(),
      lookupOf(ctx),
    ]);
    const count = (match: (task: Doc<"tasks">) => boolean) =>
      tasks.filter(match).length;
    return {
      categories: lookup.categories.map((category) => ({
        color: category.color,
        name: category.name,
        tasks: count(
          (task) => task.categoryIds?.includes(category._id) === true
        ),
      })),
      people: [...lookup.people.values()]
        .filter((admin) => admin.active)
        // Names only: emails stay out of what's sent to the app's provider.
        .map((admin) => personName(admin)),
      statuses: STATUSES.map((status) => ({
        ...status,
        tasks: count((task) => task.status === status.key),
      })),
      you: personName(me),
    };
  },
});

export const listTasks = query({
  args: {
    ...grantArgs,
    assignee: v.optional(v.string()),
    category: v.optional(v.string()),
    includeDone: v.optional(v.boolean()),
    search: v.optional(v.string()),
    statuses: v.optional(v.array(taskStatus)),
  },
  handler: async (ctx, args) => {
    const me = await actorOf(ctx, args.serviceKey, args.grantId, false);
    const lookup = await lookupOf(ctx);
    const unassigned =
      args.assignee !== undefined && fold(args.assignee) === "none";
    const assignee =
      args.assignee === undefined || unassigned
        ? undefined
        : await findPerson(ctx, args.assignee, me);
    const category =
      args.category === undefined
        ? undefined
        : (await findCategories(ctx, [args.category]))[0];
    const statuses = new Set<Status>(
      args.statuses?.length
        ? args.statuses
        : STATUSES.map((status) => status.key).filter(
            (key) => args.includeDone === true || key !== "done"
          )
    );
    const words = fold(args.search ?? "")
      .split(/\s+/u)
      .filter(Boolean);

    const tasks = await ctx.db.query("tasks").collect();
    const matches = tasks
      .filter((task) => {
        if (!statuses.has(task.status)) {
          return false;
        }
        if (unassigned && task.assigneeId !== undefined) {
          return false;
        }
        if (assignee && task.assigneeId !== assignee._id) {
          return false;
        }
        if (category && !task.categoryIds?.includes(category)) {
          return false;
        }
        if (words.length === 0) {
          return true;
        }
        const view = viewOf(task, lookup);
        const text = fold(
          [view.title, view.description ?? "", ...view.categories].join(" ")
        );
        return words.every((word) => text.includes(word));
      })
      .toSorted(
        (a, b) =>
          STATUSES.findIndex((status) => status.key === a.status) -
            STATUSES.findIndex((status) => status.key === b.status) ||
          a.order - b.order
      );
    return {
      tasks: matches.slice(0, MAX_TASKS).map((task) => viewOf(task, lookup)),
      total: matches.length,
    };
  },
});

export const getTask = query({
  args: { ...grantArgs, taskId: v.string() },
  handler: async (ctx, args) => {
    await actorOf(ctx, args.serviceKey, args.grantId, false);
    const task = await findTask(ctx, args.taskId);
    return {
      ...viewOf(task, await lookupOf(ctx)),
      created_at: new Date(task.createdAt).toISOString(),
    };
  },
});

// Changing

export const createTask = mutation({
  args: {
    ...grantArgs,
    assignee: v.optional(v.string()),
    categories: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    status: v.optional(taskStatus),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const me = await actorOf(ctx, args.serviceKey, args.grantId, true);
    const status = args.status ?? "todo";
    const now = Date.now();
    const taskId = await ctx.db.insert("tasks", {
      assigneeId: args.assignee
        ? (await findPerson(ctx, args.assignee, me))._id
        : undefined,
      categoryIds: await findCategories(ctx, args.categories ?? []),
      createdAt: now,
      description: args.description?.trim() || undefined,
      dueDate: args.dueDate ? checkDate(args.dueDate) : undefined,
      order: await endOrder(ctx, status),
      status,
      title: cleanTitle(args.title),
      updatedAt: now,
    });
    return await shown(ctx, taskId);
  },
});

export const updateTask = mutation({
  args: {
    ...grantArgs,
    assignee: v.optional(v.union(v.string(), v.null())),
    categories: v.optional(v.array(v.string())),
    description: v.optional(v.union(v.string(), v.null())),
    dueDate: v.optional(v.union(v.string(), v.null())),
    status: v.optional(taskStatus),
    taskId: v.string(),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const me = await actorOf(ctx, args.serviceKey, args.grantId, true);
    const task = await findTask(ctx, args.taskId);
    // Fields left out stay; null clears. Undefined in a patch removes a field.
    const patch: Partial<Doc<"tasks">> = { updatedAt: Date.now() };
    if (args.title !== undefined) {
      patch.title = cleanTitle(args.title);
    }
    if (args.description !== undefined) {
      patch.description = args.description?.trim() || undefined;
    }
    if (args.assignee !== undefined) {
      patch.assigneeId = args.assignee
        ? (await findPerson(ctx, args.assignee, me))._id
        : undefined;
    }
    if (args.dueDate !== undefined) {
      patch.dueDate = args.dueDate ? checkDate(args.dueDate) : undefined;
    }
    if (args.categories !== undefined) {
      patch.categoryIds = await findCategories(ctx, args.categories);
    }
    if (args.status !== undefined && args.status !== task.status) {
      // Moved to another column, it joins the end of that one.
      patch.status = args.status;
      patch.order = await endOrder(ctx, args.status);
    }
    await ctx.db.patch(task._id, patch);
    return await shown(ctx, task._id);
  },
});

export const deleteTask = mutation({
  args: { ...grantArgs, taskId: v.string() },
  handler: async (ctx, args) => {
    await actorOf(ctx, args.serviceKey, args.grantId, true);
    const task = await findTask(ctx, args.taskId);
    await ctx.db.delete(task._id);
    return { deleted: task.title, id: task._id };
  },
});

export const createCategory = mutation({
  args: {
    ...grantArgs,
    color: v.optional(labelColor),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await actorOf(ctx, args.serviceKey, args.grantId, true);
    const name = args.name.trim();
    if (!name) {
      throw refuse("A category needs a name.");
    }
    const categories = await allCategories(ctx);
    // A name the board has already is that category, not a twin.
    const existing = categories.find(
      (category) => fold(category.name) === fold(name)
    );
    if (existing) {
      return { color: existing.color, created: false, name: existing.name };
    }
    const color = args.color ?? nextColor(categories);
    await ctx.db.insert("taskCategories", { color, name });
    return { color, created: true, name };
  },
});
