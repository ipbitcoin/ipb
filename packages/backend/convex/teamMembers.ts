import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { assertServiceKey, localeArg, mediaUrl, pick } from "./lib";

export const list = query({
  args: { locale: localeArg },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_order")
      .order("asc")
      .collect();
    return members
      .filter((m) => m.published)
      .map((m) => ({
        description: pick(m.description, args.locale),
        documentId: m._id,
        linkedin: m.linkedin ?? null,
        name: m.name,
        nostr: m.nostr ?? null,
        order: m.order,
        picture: { url: mediaUrl(m.pictureKey) },
        role: pick(m.role, args.locale),
      }));
  },
});

// ── Admin ──────────────────────────────────────────────────────────────────

const localizedString = v.object({ en: v.string(), pt: v.string() });

const teamMemberFields = {
  description: localizedString,
  linkedin: v.optional(v.string()),
  name: v.string(),
  nostr: v.optional(v.string()),
  order: v.number(),
  pictureKey: v.string(),
  published: v.boolean(),
  role: localizedString,
};

export const adminList = query({
  args: { serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    return await ctx.db
      .query("teamMembers")
      .withIndex("by_order")
      .order("asc")
      .collect();
  },
});

export const adminGet = query({
  args: { id: v.id("teamMembers"), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    return await ctx.db.get(args.id);
  },
});

export const adminCreate = mutation({
  args: { serviceKey: v.string(), ...teamMemberFields },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const { serviceKey: _serviceKey, ...fields } = args;
    return await ctx.db.insert("teamMembers", fields);
  },
});

export const adminUpdate = mutation({
  args: {
    id: v.id("teamMembers"),
    serviceKey: v.string(),
    ...teamMemberFields,
  },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const { serviceKey: _serviceKey, id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const adminRemove = mutation({
  args: { id: v.id("teamMembers"), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    await ctx.db.delete(args.id);
  },
});
