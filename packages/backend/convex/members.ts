import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { assertServiceKey } from "./lib";
import { findMemberByEmail, layerOfMember, planLayer } from "./pricing";

/**
 * Sign-up from the www member-register server route.
 *
 * - New email: creates the member.
 * - Existing email, not active (pending / cancelled / expired): the old record
 *   is replaced by this sign-up.
 * - Existing active member on a different layer: this is an upgrade/downgrade.
 *   The current layer stays in force until the new payment completes; then
 *   `activate` switches the layer and hands back the old subscription to
 *   cancel. In dev mode (no Stripe) the switch is immediate.
 * - Existing active member on the same layer: rejected.
 *
 * Fiscal number stays unique across members.
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

    const existing = await findMemberByEmail(ctx, args.email);

    if (args.fiscalNumber) {
      const byFiscal = await ctx.db
        .query("members")
        .withIndex("by_fiscal_number", (q) =>
          q.eq("fiscalNumber", args.fiscalNumber)
        )
        .unique();
      if (byFiscal && byFiscal._id !== existing?._id) {
        throw new Error("unique: fiscal number already registered");
      }
    }

    const { serviceKey: _serviceKey, ...fields } = args;
    const layer = planLayer(args.paymentPlan);

    if (!existing) {
      return await ctx.db.insert("members", { ...fields, layer });
    }

    if (existing.paymentStatus !== "active") {
      // Replace the old record (a stale `pending` sign-up, or a lapsed member).
      await ctx.db.replace(existing._id, {
        ...fields,
        importId: existing.importId,
        layer,
      });
      return existing._id;
    }

    if (layerOfMember(existing) === layer) {
      throw new Error("unique: already an active member on this layer");
    }

    // Active member switching layer.
    const personalData = {
      address: args.address ?? existing.address,
      birthday: args.birthday ?? existing.birthday,
      citizenCardNumber: args.citizenCardNumber ?? existing.citizenCardNumber,
      fiscalNumber: args.fiscalNumber ?? existing.fiscalNumber,
      name: args.name,
    };
    if (args.paymentStatus === "active") {
      await ctx.db.patch(existing._id, {
        ...personalData,
        layer,
        paymentPlan: args.paymentPlan,
        pendingPlan: undefined,
        replacesSubscriptionId: undefined,
      });
    } else {
      await ctx.db.patch(existing._id, {
        ...personalData,
        pendingPlan: args.paymentPlan,
        replacesSubscriptionId: existing.stripeSubscriptionId || undefined,
      });
    }
    return existing._id;
  },
});

/**
 * Activate on checkout.session.completed (stores Stripe ids). If this payment
 * completes a layer change, switches the layer and returns the previous
 * subscription so the webhook can cancel it.
 */
export const activate = mutation({
  args: {
    id: v.id("members"),
    serviceKey: v.string(),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const member = await ctx.db.get(args.id);
    if (!member) {
      return { cancelSubscriptionId: undefined };
    }

    const switching = member.pendingPlan;
    await ctx.db.patch(args.id, {
      paymentStatus: "active",
      stripeCustomerId: args.stripeCustomerId ?? "",
      stripeSubscriptionId: args.stripeSubscriptionId ?? "",
      ...(switching && {
        layer: planLayer(switching),
        paymentPlan: switching,
        pendingPlan: undefined,
        replacesSubscriptionId: undefined,
      }),
    });

    const previous = member.replacesSubscriptionId;
    return {
      cancelSubscriptionId:
        switching && previous && previous !== args.stripeSubscriptionId
          ? previous
          : undefined,
    };
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
