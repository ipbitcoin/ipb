import { createHmac, timingSafeEqual } from "node:crypto";

import { api } from "@ipb/backend/api";

function verifyStripeSignature(
  rawBody: string,
  sig: string,
  secret: string
): boolean {
  const parts = sig.split(",");
  const timestamp = parts.find((p) => p.startsWith("t="))?.slice(2);
  const v1 = parts.find((p) => p.startsWith("v1="))?.slice(3);
  if (!timestamp || !v1) {
    return false;
  }

  const signed = `${timestamp}.${rawBody}`;
  const expected = createHmac("sha256", secret)
    .update(signed, "utf-8")
    .digest("hex");

  // Constant-time comparison to prevent timing attacks
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
  } catch {
    return false;
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();

  // Read raw body before any parsing (required for signature verification)
  const rawBody = (await readRawBody(event, "utf-8")) ?? "";
  const sig = getRequestHeader(event, "stripe-signature") ?? "";

  // Verify signature if secret is configured
  if (config.STRIPE_WEBHOOK_SECRET) {
    if (
      !sig ||
      !verifyStripeSignature(rawBody, sig, config.STRIPE_WEBHOOK_SECRET)
    ) {
      throw createError({
        message: "Invalid Stripe signature",
        statusCode: 400,
      });
    }
  }

  const stripeEvent = JSON.parse(rawBody);
  const convex = convexClient();
  const serviceKey = config.SERVICE_KEY;

  // ── checkout.session.completed ───────────────────────────────────────────
  // Fires for one-time payments (mode: payment) and first payment of subscriptions
  if (stripeEvent.type === "checkout.session.completed") {
    const session = stripeEvent.data.object;
    const { type, memberId } = session.metadata ?? {};

    if (type === "membership" && memberId) {
      try {
        await convex.mutation(api.members.activate, {
          id: memberId,
          serviceKey,
          stripeCustomerId: session.customer ?? "",
          stripeSubscriptionId: session.subscription ?? "",
        });
      } catch (error: unknown) {
        console.error("[stripe-webhook] Failed to update member:", error);
      }
    }
  }

  // ── invoice.payment_succeeded ────────────────────────────────────────────
  // Fires on every successful recurring subscription payment
  if (stripeEvent.type === "invoice.payment_succeeded") {
    const invoice = stripeEvent.data.object;
    const subscriptionId = invoice.subscription;

    if (subscriptionId) {
      try {
        await convex.mutation(api.members.activateBySubscription, {
          serviceKey,
          stripeSubscriptionId: subscriptionId,
        });
      } catch (error: unknown) {
        console.error(
          "[stripe-webhook] Failed to update member on renewal:",
          error
        );
      }
    }
  }

  // ── payment_intent.succeeded (enrollment) ────────────────────────────────
  if (stripeEvent.type === "payment_intent.succeeded") {
    const intent = stripeEvent.data.object;
    const { type, enrollmentId } = intent.metadata ?? {};

    if (type === "enrollment" && enrollmentId) {
      try {
        // markPaid atomically decrements the training's stockLeft (idempotent)
        await convex.mutation(api.enrollments.markPaid, {
          id: enrollmentId,
          serviceKey,
        });
      } catch (error: unknown) {
        console.error(
          "[stripe-webhook] Failed to mark enrollment paid:",
          error
        );
      }
    }
  }

  // ── payment_intent.payment_failed (enrollment) ───────────────────────────
  if (stripeEvent.type === "payment_intent.payment_failed") {
    const intent = stripeEvent.data.object;
    const { type, enrollmentId } = intent.metadata ?? {};

    if (type === "enrollment" && enrollmentId) {
      try {
        await convex.mutation(api.enrollments.markFailed, {
          id: enrollmentId,
          serviceKey,
        });
      } catch (error: unknown) {
        console.error(
          "[stripe-webhook] Failed to mark enrollment failed:",
          error
        );
      }
    }
  }

  // ── customer.subscription.deleted ────────────────────────────────────────
  if (stripeEvent.type === "customer.subscription.deleted") {
    const subscription = stripeEvent.data.object;
    try {
      await convex.mutation(api.members.cancelBySubscription, {
        serviceKey,
        stripeSubscriptionId: subscription.id,
      });
    } catch (error: unknown) {
      console.error(
        "[stripe-webhook] Failed to cancel member subscription:",
        error
      );
    }
  }

  return { received: true };
});
