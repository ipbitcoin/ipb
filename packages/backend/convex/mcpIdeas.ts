import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { IDEA_PLATFORMS, ideaPlatform, ideaStatus, labelColor } from "./lib";
import {
  actorOf,
  fold,
  grantArgs,
  nextColor,
  ORDER_STEP,
  personName,
  pickOne,
  refuse,
} from "./mcpTasks";

/**
 * What the admin's MCP tools read and change on the social media board: the
 * ideas for videos and posts. Grants are checked as for the tasks board
 * (mcpTasks.ts), in the same transaction as the work.
 */

type Status = Doc<"socialMediaIdeas">["status"];
type Platform = Doc<"socialMediaIdeas">["platforms"][number];

/** The board's columns, in order, with the names people see. */
const STATUSES: { key: Status; label: string }[] = [
  { key: "draft", label: "Rascunho" },
  { key: "pending", label: "Pendente" },
  { key: "approved", label: "Aprovada" },
  { key: "recorded", label: "Gravada" },
  { key: "edited", label: "Editada" },
  { key: "posted", label: "Publicada" },
];

/** Most ideas list_ideas returns at once. */
const MAX_IDEAS = 200;

async function allLabels(ctx: QueryCtx): Promise<Doc<"ideaLabels">[]> {
  return await ctx.db
    .query("ideaLabels")
    .withIndex("by_name")
    .order("asc")
    .collect();
}

/** Labels by name, in the board's order; unknown ones are refused. */
async function findLabels(
  ctx: QueryCtx,
  names: string[]
): Promise<Id<"ideaLabels">[]> {
  const labels = await allLabels(ctx);
  const picked = new Set(
    names.map(
      (ref) =>
        pickOne(
          ref,
          labels,
          (label) => [label.name],
          (label) => label.name,
          "label",
          "get_social_board lists the labels; create_idea_label adds one."
        )._id
    )
  );
  return labels.map((label) => label._id).filter((id) => picked.has(id));
}

/** Platforms once each, in the board's order. */
function platformsOf(platforms: Platform[]): Platform[] {
  return IDEA_PLATFORMS.filter((platform) => platforms.includes(platform));
}

async function findIdea(
  ctx: QueryCtx,
  ref: string
): Promise<Doc<"socialMediaIdeas">> {
  const id = ctx.db.normalizeId("socialMediaIdeas", ref.trim());
  const idea = id && (await ctx.db.get(id));
  if (!idea) {
    throw refuse(`There's no idea with id ${ref}. list_ideas shows them.`);
  }
  return idea;
}

function cleanTitle(title: string): string {
  const clean = title.trim();
  if (!clean) {
    throw refuse("An idea needs a title.");
  }
  return clean;
}

/** The order that puts an idea last in a column, as the admin board does. */
async function endOrder(ctx: QueryCtx, status: Status): Promise<number> {
  const last = await ctx.db
    .query("socialMediaIdeas")
    .withIndex("by_status_order", (q) => q.eq("status", status))
    .order("desc")
    .first();
  return last ? last.order + ORDER_STEP : ORDER_STEP;
}

/** An idea as list_ideas shows it: everything but the description. */
function summaryOf(idea: Doc<"socialMediaIdeas">, labels: Doc<"ideaLabels">[]) {
  const ids = new Set(idea.labelIds);
  return {
    id: idea._id,
    labels: labels
      .filter((label) => ids.has(label._id))
      .map((label) => label.name),
    platforms: idea.platforms,
    status: idea.status,
    title: idea.title,
    updated_at: new Date(idea.updatedAt).toISOString(),
  };
}

function viewOf(idea: Doc<"socialMediaIdeas">, labels: Doc<"ideaLabels">[]) {
  return {
    ...summaryOf(idea, labels),
    created_at: new Date(idea.createdAt).toISOString(),
    description: idea.description,
  };
}

async function shown(ctx: QueryCtx, ideaId: Id<"socialMediaIdeas">) {
  const idea = await ctx.db.get(ideaId);
  return idea ? viewOf(idea, await allLabels(ctx)) : null;
}

// Reading

export const board = query({
  args: grantArgs,
  handler: async (ctx, args) => {
    const me = await actorOf(ctx, args.serviceKey, args.grantId, false);
    const [ideas, labels] = await Promise.all([
      ctx.db.query("socialMediaIdeas").collect(),
      allLabels(ctx),
    ]);
    const count = (match: (idea: Doc<"socialMediaIdeas">) => boolean) =>
      ideas.filter(match).length;
    return {
      labels: labels.map((label) => ({
        color: label.color,
        ideas: count((idea) => idea.labelIds?.includes(label._id) === true),
        name: label.name,
      })),
      platforms: IDEA_PLATFORMS.map((platform) => ({
        ideas: count((idea) => idea.platforms.includes(platform)),
        key: platform,
      })),
      statuses: STATUSES.map((status) => ({
        ...status,
        ideas: count((idea) => idea.status === status.key),
      })),
      you: personName(me),
    };
  },
});

export const listIdeas = query({
  args: {
    ...grantArgs,
    includePosted: v.optional(v.boolean()),
    label: v.optional(v.string()),
    platform: v.optional(ideaPlatform),
    search: v.optional(v.string()),
    statuses: v.optional(v.array(ideaStatus)),
  },
  handler: async (ctx, args) => {
    await actorOf(ctx, args.serviceKey, args.grantId, false);
    const labels = await allLabels(ctx);
    const label =
      args.label === undefined
        ? undefined
        : (await findLabels(ctx, [args.label]))[0];
    const statuses = new Set<Status>(
      args.statuses?.length
        ? args.statuses
        : STATUSES.map((status) => status.key).filter(
            (key) => args.includePosted === true || key !== "posted"
          )
    );
    const words = fold(args.search ?? "")
      .split(/\s+/u)
      .filter(Boolean);

    const ideas = await ctx.db.query("socialMediaIdeas").collect();
    const matches = ideas
      .filter((idea) => {
        if (!statuses.has(idea.status)) {
          return false;
        }
        if (label && !idea.labelIds?.includes(label)) {
          return false;
        }
        if (args.platform && !idea.platforms.includes(args.platform)) {
          return false;
        }
        if (words.length === 0) {
          return true;
        }
        const summary = summaryOf(idea, labels);
        const text = fold(
          [summary.title, idea.description, ...summary.labels].join(" ")
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
      ideas: matches.slice(0, MAX_IDEAS).map((idea) => summaryOf(idea, labels)),
      total: matches.length,
    };
  },
});

export const getIdea = query({
  args: { ...grantArgs, ideaId: v.string() },
  handler: async (ctx, args) => {
    await actorOf(ctx, args.serviceKey, args.grantId, false);
    const idea = await findIdea(ctx, args.ideaId);
    return viewOf(idea, await allLabels(ctx));
  },
});

// Changing

export const createIdea = mutation({
  args: {
    ...grantArgs,
    description: v.optional(v.string()),
    labels: v.optional(v.array(v.string())),
    platforms: v.optional(v.array(ideaPlatform)),
    status: v.optional(ideaStatus),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    await actorOf(ctx, args.serviceKey, args.grantId, true);
    const status = args.status ?? "draft";
    const now = Date.now();
    const ideaId = await ctx.db.insert("socialMediaIdeas", {
      createdAt: now,
      description: args.description?.trim() ?? "",
      labelIds: await findLabels(ctx, args.labels ?? []),
      order: await endOrder(ctx, status),
      platforms: platformsOf(args.platforms ?? []),
      status,
      title: cleanTitle(args.title),
      updatedAt: now,
    });
    return await shown(ctx, ideaId);
  },
});

export const updateIdea = mutation({
  args: {
    ...grantArgs,
    description: v.optional(v.string()),
    ideaId: v.string(),
    labels: v.optional(v.array(v.string())),
    platforms: v.optional(v.array(ideaPlatform)),
    status: v.optional(ideaStatus),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await actorOf(ctx, args.serviceKey, args.grantId, true);
    const idea = await findIdea(ctx, args.ideaId);
    // Fields left out stay as they are.
    const patch: Partial<Doc<"socialMediaIdeas">> = { updatedAt: Date.now() };
    if (args.title !== undefined) {
      patch.title = cleanTitle(args.title);
    }
    if (args.description !== undefined) {
      patch.description = args.description.trim();
    }
    if (args.labels !== undefined) {
      patch.labelIds = await findLabels(ctx, args.labels);
      // Given labels, the retired category goes, as when the admin saves.
      patch.categoryId = undefined;
    }
    if (args.platforms !== undefined) {
      patch.platforms = platformsOf(args.platforms);
    }
    if (args.status !== undefined && args.status !== idea.status) {
      // Moved to another column, it joins the end of that one.
      patch.status = args.status;
      patch.order = await endOrder(ctx, args.status);
    }
    await ctx.db.patch(idea._id, patch);
    return await shown(ctx, idea._id);
  },
});

export const createLabel = mutation({
  args: {
    ...grantArgs,
    color: v.optional(labelColor),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await actorOf(ctx, args.serviceKey, args.grantId, true);
    const name = args.name.trim();
    if (!name) {
      throw refuse("A label needs a name.");
    }
    const labels = await allLabels(ctx);
    // A name the board has already is that label, not a twin.
    const existing = labels.find((label) => fold(label.name) === fold(name));
    if (existing) {
      return { color: existing.color, created: false, name: existing.name };
    }
    const color = args.color ?? nextColor(labels);
    await ctx.db.insert("ideaLabels", { color, name });
    return { color, created: true, name };
  },
});
