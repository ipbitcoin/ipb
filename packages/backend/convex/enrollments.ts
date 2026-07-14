import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { assertServiceKey } from "./lib";

const PRICE_EUR = 200;

/**
 * Public mutation used by the www enrollment form.
 * Validates the training and creates a pending enrollment.
 */
export const create = mutation({
  args: {
    birthday: v.string(),
    boughtBitcoin: v.optional(v.boolean()),
    email: v.string(),
    expectations: v.optional(v.string()),
    hasExposure: v.optional(v.boolean()),
    hasSelfCustody: v.optional(v.boolean()),
    name: v.string(),
    nif: v.optional(v.string()),
    participatedWorkshop: v.optional(v.boolean()),
    phone: v.optional(v.string()),
    trainingId: v.id("trainings"),
  },
  handler: async (ctx, args) => {
    if (!(args.name.trim() && args.email.includes("@") && args.birthday)) {
      throw new Error("Missing required fields");
    }

    const training = await ctx.db.get(args.trainingId);
    if (!training) {
      throw new Error("Training not found");
    }
    if (!training.active) {
      throw new Error("Training is not active");
    }
    if (training.stockLeft <= 0) {
      throw new Error("Training is sold out");
    }

    const orderId = `ORD-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase()}`;

    const enrollmentId = await ctx.db.insert("enrollments", {
      birthday: args.birthday,
      boughtBitcoin: args.boughtBitcoin,
      email: args.email,
      expectations: args.expectations ?? "",
      hasExposure: args.hasExposure,
      hasSelfCustody: args.hasSelfCustody,
      name: args.name,
      nif: args.nif ?? "",
      orderId,
      participatedWorkshop: args.participatedWorkshop,
      paymentStatus: "pending",
      phone: args.phone ?? "",
      trainingId: args.trainingId,
      value: PRICE_EUR,
    });

    return { enrollmentId, orderId, priceEur: PRICE_EUR };
  },
});

// ── Service mutations (payment webhooks / server routes) ───────────────────

export const setStripeId = mutation({
  args: {
    id: v.id("enrollments"),
    serviceKey: v.string(),
    stripeId: v.string(),
  },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    await ctx.db.patch(args.id, { stripeId: args.stripeId });
  },
});

/**
 * Marks an enrollment paid and atomically decrements the training's stockLeft.
 * Idempotent: an already-paid enrollment does not decrement twice.
 */
export const markPaid = mutation({
  args: { id: v.id("enrollments"), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const enrollment = await ctx.db.get(args.id);
    if (!enrollment) {
      throw new Error("Enrollment not found");
    }
    if (enrollment.paymentStatus === "paid") {
      return;
    }
    await ctx.db.patch(args.id, { paymentStatus: "paid" });
    const training = await ctx.db.get(enrollment.trainingId);
    if (training && training.stockLeft > 0) {
      await ctx.db.patch(training._id, { stockLeft: training.stockLeft - 1 });
    }
  },
});

export const markFailed = mutation({
  args: { id: v.id("enrollments"), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    await ctx.db.patch(args.id, { paymentStatus: "failed" });
  },
});

// ── Admin (read-only) ──────────────────────────────────────────────────────

export const adminList = query({
  args: {
    paymentStatus: v.optional(
      v.union(v.literal("pending"), v.literal("paid"), v.literal("failed"))
    ),
    serviceKey: v.string(),
    trainingId: v.optional(v.id("trainings")),
  },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const { trainingId } = args;
    let enrollments = trainingId
      ? await ctx.db
          .query("enrollments")
          .withIndex("by_training", (q) => q.eq("trainingId", trainingId))
          .order("desc")
          .collect()
      : await ctx.db.query("enrollments").order("desc").collect();
    if (args.paymentStatus) {
      enrollments = enrollments.filter(
        (e) => e.paymentStatus === args.paymentStatus
      );
    }
    return enrollments;
  },
});
