import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { assertServiceKey } from "./lib";

/**
 * Invite-only admin accounts for the admin app.
 *
 * Invites are created by hand in the Convex dashboard: insert a row with
 * { email: "person@example.com", active: true }. On their FIRST login the
 * invitee sets a password (the admin app hashes it with scrypt and stores the
 * hash here). Anyone without a row cannot log in. Deactivate by setting
 * active: false or deleting the row.
 */

export const getByEmail = query({
  args: { email: v.string(), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    return await ctx.db
      .query("adminUsers")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .unique();
  },
});

/** Claim a dashboard-created account: set the password hash exactly once. */
export const claimAccount = mutation({
  args: {
    email: v.string(),
    passwordHash: v.string(),
    serviceKey: v.string(),
  },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const user = await ctx.db
      .query("adminUsers")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .unique();
    if (!(user && user.active)) {
      throw new Error("No active invite for this email");
    }
    if (user.passwordHash) {
      throw new Error("Account already claimed");
    }
    await ctx.db.patch(user._id, { passwordHash: args.passwordHash });
  },
});

/** Active admins for assignee pickers and avatars — never exposes hashes. */
export const listAdmins = query({
  args: { serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const users = await ctx.db.query("adminUsers").collect();
    return users
      .filter((u) => u.active)
      .map((u) => ({
        _id: u._id,
        avatarKey: u.avatarKey,
        email: u.email,
        name: u.name,
        username: u.username,
      }));
  },
});

export const updateProfile = mutation({
  args: {
    avatarKey: v.optional(v.string()),
    email: v.string(),
    serviceKey: v.string(),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const user = await ctx.db
      .query("adminUsers")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .unique();
    if (!(user && user.active)) {
      throw new Error("No active account for this email");
    }
    const username = args.username.trim().toLowerCase();
    if (!username) {
      throw new Error("Username em falta");
    }
    const existing = await ctx.db
      .query("adminUsers")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();
    if (existing && existing._id !== user._id) {
      throw new Error("Username já em uso");
    }
    await ctx.db.patch(user._id, { avatarKey: args.avatarKey, username });
    return { avatarKey: args.avatarKey, username };
  },
});
