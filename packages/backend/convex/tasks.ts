import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { assertServiceKey } from "./lib";

const statusValidator = v.union(
  v.literal("backlog"),
  v.literal("todo"),
  v.literal("in_progress"),
  v.literal("in_review"),
  v.literal("done")
);

const taskFields = {
  assigneeId: v.optional(v.id("adminUsers")),
  description: v.optional(v.string()),
  dueDate: v.optional(v.string()), // ISO date "YYYY-MM-DD"
  order: v.number(),
  status: statusValidator,
  title: v.string(),
};

export const adminList = query({
  args: { serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    return await ctx.db.query("tasks").collect();
  },
});

export const adminGet = query({
  args: { id: v.id("tasks"), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    return await ctx.db.get(args.id);
  },
});

export const adminCreate = mutation({
  args: { serviceKey: v.string(), ...taskFields },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const { serviceKey: _serviceKey, ...fields } = args;
    const now = Date.now();
    return await ctx.db.insert("tasks", {
      ...fields,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const adminUpdate = mutation({
  args: { id: v.id("tasks"), serviceKey: v.string(), ...taskFields },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const { serviceKey: _serviceKey, id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const adminMove = mutation({
  args: {
    id: v.id("tasks"),
    order: v.number(),
    serviceKey: v.string(),
    status: statusValidator,
  },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    await ctx.db.patch(args.id, {
      order: args.order,
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const adminRemove = mutation({
  args: { id: v.id("tasks"), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    await ctx.db.delete(args.id);
  },
});
