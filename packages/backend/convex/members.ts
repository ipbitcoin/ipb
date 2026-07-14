import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { assertServiceKey } from "./lib";

/**
 * Creates a member record (called from the www member-register server route).
 * Enforces unique email and fiscal number like the old Strapi schema did.
 */
export const create = mutation({
  args: {
    address: v.optional(v.string()),
    birthday: v.optional(v.string()),
    citizenCardNumber: v.optional(v.string()),
    email: v.string(),
    fiscalNumber: v.optional(v.string()),
    name: v.string(),
    paymentPlan: v.union(v.literal("yearly"), v.literal("monthly")),
    paymentStatus: v.union(v.literal("pending"), v.literal("active")),
    serviceKey: v.string(),
  },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);

    const byEmail = await ctx.db
      .query("members")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
    if (byEmail) {
      throw new Error("unique: email already registered");
    }

    if (args.fiscalNumber) {
      const byFiscal = await ctx.db
        .query("members")
        .withIndex("by_fiscal_number", (q) =>
          q.eq("fiscalNumber", args.fiscalNumber)
        )
        .unique();
      if (byFiscal) {
        throw new Error("unique: fiscal number already registered");
      }
    }

    const { serviceKey: _serviceKey, ...fields } = args;
    return await ctx.db.insert("members", fields);
  },
});

/** Activate on checkout.session.completed (stores Stripe ids). */
export const activate = mutation({
  args: {
    id: v.id("members"),
    serviceKey: v.string(),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    await ctx.db.patch(args.id, {
      paymentStatus: "active",
      stripeCustomerId: args.stripeCustomerId ?? "",
      stripeSubscriptionId: args.stripeSubscriptionId ?? "",
    });
  },
});

/** Re-activate on invoice.payment_succeeded (subscription renewal). */
export const activateBySubscription = mutation({
  args: { serviceKey: v.string(), stripeSubscriptionId: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const member = await ctx.db
      .query("members")
      .withIndex("by_subscription", (q) =>
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId)
      )
      .unique();
    if (member) {
      await ctx.db.patch(member._id, { paymentStatus: "active" });
    }
  },
});

/** Cancel on customer.subscription.deleted. */
export const cancelBySubscription = mutation({
  args: { serviceKey: v.string(), stripeSubscriptionId: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const member = await ctx.db
      .query("members")
      .withIndex("by_subscription", (q) =>
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId)
      )
      .unique();
    if (member) {
      await ctx.db.patch(member._id, { paymentStatus: "cancelled" });
    }
  },
});

// ── Admin (read-only) ──────────────────────────────────────────────────────

export const adminList = query({
  args: {
    paymentStatus: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("active"),
        v.literal("expired"),
        v.literal("cancelled")
      )
    ),
    serviceKey: v.string(),
  },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const members = await ctx.db.query("members").order("desc").collect();
    if (args.paymentStatus) {
      return members.filter((m) => m.paymentStatus === args.paymentStatus);
    }
    return members;
  },
});
