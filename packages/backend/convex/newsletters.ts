import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { assertServiceKey } from "./lib";

/** Public, idempotent by email. */
export const subscribe = mutation({
  args: { email: v.string(), name: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Invalid email address");
    }
    const existing = await ctx.db
      .query("newsletters")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (existing) {
      return existing._id;
    }
    return await ctx.db.insert("newsletters", { email, name: args.name });
  },
});

// ── Admin (read-only) ──────────────────────────────────────────────────────

export const adminList = query({
  args: { serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    return await ctx.db.query("newsletters").order("desc").collect();
  },
});
