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
 *   Nothing changes here (the sign-up isn't authenticated): the current layer
 *   stays in force until the new payment completes, then `activate` switches
 *   the layer and hands back the old subscription to cancel. In dev mode (no
 *   Stripe) the switch is immediate.
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

    // Active member switching layer: only dev mode (no payment) switches here.
    if (args.paymentStatus === "active") {
      await ctx.db.patch(existing._id, {
        layer,
        paymentPlan: args.paymentPlan,
      });
    }
    return existing._id;
  },
});

/**
 * Activate on checkout.session.completed (stores Stripe ids). The layer comes
 * from the plan that was actually paid (checkout metadata), not from the
 * record, which a later unpaid sign-up may have changed.
 *
 * One member = one subscription: if a different subscription was active, it
 * is returned so the webhook cancels it (layer change, or a double checkout).
 * It stays in `replacesSubscriptionId` until the webhook confirms the cancel,
 * so a Stripe retry of this event retries the cancel too.
 */
export const activate = mutation({
  args: {
    id: v.id("members"),
    paymentPlan: v.optional(v.union(v.literal("yearly"), v.literal("monthly"))),
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

    const replaced =
      member.paymentStatus === "active" &&
      member.stripeSubscriptionId &&
      member.stripeSubscriptionId !== args.stripeSubscriptionId
        ? member.stripeSubscriptionId
        : undefined;
    const cancelSubscriptionId = replaced ?? member.replacesSubscriptionId;
    // Checkouts created before the plan was in the metadata: keep the record's.
    const paymentPlan = args.paymentPlan ?? member.paymentPlan;

    await ctx.db.patch(args.id, {
      layer: args.paymentPlan ? planLayer(paymentPlan) : member.layer,
      paymentPlan,
      paymentStatus: "active",
      replacesSubscriptionId: cancelSubscriptionId,
      stripeCustomerId: args.stripeCustomerId ?? "",
      stripeSubscriptionId: args.stripeSubscriptionId ?? "",
    });

    return { cancelSubscriptionId };
  },
});

/** Called by the webhook once the replaced subscription is cancelled in Stripe. */
export const clearReplacedSubscription = mutation({
  args: {
    id: v.id("members"),
    serviceKey: v.string(),
    stripeSubscriptionId: v.string(),
  },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const member = await ctx.db.get(args.id);
    if (member?.replacesSubscriptionId === args.stripeSubscriptionId) {
      await ctx.db.patch(args.id, { replacesSubscriptionId: undefined });
    }
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
