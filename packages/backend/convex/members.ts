import { v } from "convex/values";

import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { assertServiceKey } from "./lib";
import { findMemberByEmail, layerOfMember, planLayer } from "./pricing";

const nonEmpty = (ids: string[]) => (ids.length > 0 ? ids : undefined);

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

    // Members receive the newsletter: keep the Resend contact in step with
    // anything that makes them active (only dev mode activates here).
    const syncNewsletter = () =>
      args.paymentStatus === "active"
        ? ctx.scheduler.runAfter(0, internal.newsletterSync.syncContact, {
            email: args.email,
          })
        : undefined;

    if (!existing) {
      const id = await ctx.db.insert("members", { ...fields, layer });
      await syncNewsletter();
      return id;
    }

    if (existing.paymentStatus !== "active") {
      // Replace the old record (a stale `pending` sign-up, or a lapsed member).
      // Keep queued cancels and checkout ordering across the replacement.
      await ctx.db.replace(existing._id, {
        ...fields,
        cancelSubscriptionIds: existing.cancelSubscriptionIds,
        importId: existing.importId,
        lastCheckoutAt: existing.lastCheckoutAt,
        layer,
      });
      await syncNewsletter();
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
      await syncNewsletter();
    }
    return existing._id;
  },
});

/**
 * Activate on checkout.session.completed (stores Stripe ids). The layer comes
 * from the plan that was actually paid (checkout metadata), not from the
 * record, which a later unpaid sign-up may have changed.
 *
 * One member = one subscription, and the newest checkout wins. The
 * subscription it replaces (layer change, double checkout), or the older one
 * when Stripe redelivers an older checkout event, is queued in
 * `cancelSubscriptionIds` and returned for the webhook to cancel. Ids stay
 * queued until the webhook confirms each cancel, so a Stripe retry of the
 * event retries the cancels too.
 */
export const activate = mutation({
  args: {
    checkoutCreatedAt: v.optional(v.number()),
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
      return { cancelSubscriptionIds: [] };
    }

    const subscriptionId = args.stripeSubscriptionId ?? "";
    const queued = member.cancelSubscriptionIds ?? [];
    const queue = (id: string | undefined) =>
      id && !queued.includes(id) ? [...queued, id] : queued;

    // Redelivered older checkout: keep the newer one, cancel this one.
    if (
      args.checkoutCreatedAt !== undefined &&
      member.lastCheckoutAt !== undefined &&
      args.checkoutCreatedAt < member.lastCheckoutAt
    ) {
      const cancelSubscriptionIds = queue(
        subscriptionId === member.stripeSubscriptionId
          ? undefined
          : subscriptionId
      );
      await ctx.db.patch(args.id, {
        cancelSubscriptionIds: nonEmpty(cancelSubscriptionIds),
      });
      return { cancelSubscriptionIds };
    }

    const replaced =
      member.paymentStatus === "active" &&
      member.stripeSubscriptionId !== subscriptionId
        ? member.stripeSubscriptionId
        : undefined;
    const cancelSubscriptionIds = queue(replaced).filter(
      (id) => id !== subscriptionId
    );
    // Checkouts created before the plan was in the metadata: keep the record's.
    const paymentPlan = args.paymentPlan ?? member.paymentPlan;

    await ctx.db.patch(args.id, {
      cancelSubscriptionIds: nonEmpty(cancelSubscriptionIds),
      lastCheckoutAt: args.checkoutCreatedAt ?? member.lastCheckoutAt,
      layer: args.paymentPlan ? planLayer(paymentPlan) : member.layer,
      paymentPlan,
      paymentStatus: "active",
      stripeCustomerId: args.stripeCustomerId ?? "",
      stripeSubscriptionId: subscriptionId,
    });
    await ctx.scheduler.runAfter(0, internal.newsletterSync.syncContact, {
      email: member.email,
    });

    return { cancelSubscriptionIds };
  },
});

/** Called by the webhook once a queued subscription is cancelled in Stripe. */
export const clearCancelledSubscription = mutation({
  args: {
    id: v.id("members"),
    serviceKey: v.string(),
    stripeSubscriptionId: v.string(),
  },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const member = await ctx.db.get(args.id);
    const queued = member?.cancelSubscriptionIds ?? [];
    if (queued.includes(args.stripeSubscriptionId)) {
      await ctx.db.patch(args.id, {
        cancelSubscriptionIds: nonEmpty(
          queued.filter((id) => id !== args.stripeSubscriptionId)
        ),
      });
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
      await ctx.scheduler.runAfter(0, internal.newsletterSync.syncContact, {
        email: member.email,
      });
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
      // Ex-members stop getting the newsletter unless they also subscribed.
      await ctx.scheduler.runAfter(0, internal.newsletterSync.syncContact, {
        email: member.email,
      });
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
