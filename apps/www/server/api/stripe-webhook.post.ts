import { createHmac, timingSafeEqual } from "node:crypto";

import { api } from "@ipb/backend/api";
import type { Id } from "@ipb/backend/dataModel";

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

function errorStatus(error: unknown): number | undefined {
  const status =
    error !== null && typeof error === "object"
      ? Reflect.get(error, "statusCode")
      : undefined;
  return typeof status === "number" ? status : undefined;
}

/**
 * Cancel the subscription a layer change replaced, then clear it on the member.
 * 400/404 mean it's already gone. Any other failure answers 500 so Stripe
 * retries the event: `activate` hands the same id back until it's cleared, so
 * the member is never left paying for two subscriptions.
 */
async function cancelReplacedSubscription(
  memberId: Id<"members">,
  subscriptionId: string,
  stripeSecretKey: string
) {
  const config = useRuntimeConfig();
  try {
    await $fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
      headers: { Authorization: `Bearer ${stripeSecretKey}` },
      method: "DELETE",
    });
  } catch (error: unknown) {
    const status = errorStatus(error);
    if (status !== 400 && status !== 404) {
      console.error(
        `[stripe-webhook] Failed to cancel previous subscription ${subscriptionId}:`,
        error
      );
      throw createError({
        message: "Failed to cancel previous subscription",
        statusCode: 500,
      });
    }
    console.warn(
      `[stripe-webhook] Previous subscription ${subscriptionId} already gone (${status})`
    );
  }

  await convexClient().mutation(api.members.clearReplacedSubscription, {
    id: memberId,
    serviceKey: config.SERVICE_KEY,
    stripeSubscriptionId: subscriptionId,
  });
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
    const { type, memberId, paymentPlan } = session.metadata ?? {};

    if (type === "membership" && memberId) {
      let cancelSubscriptionId: string | undefined;
      try {
        ({ cancelSubscriptionId } = await convex.mutation(
          api.members.activate,
          {
            id: memberId,
            paymentPlan:
              paymentPlan === "yearly" || paymentPlan === "monthly"
                ? paymentPlan
                : undefined,
            serviceKey,
            stripeCustomerId: session.customer ?? "",
            stripeSubscriptionId: session.subscription ?? "",
          }
        ));
      } catch (error: unknown) {
        console.error("[stripe-webhook] Failed to update member:", error);
      }

      // Layer upgrade/downgrade: the new subscription is paid, so end the old one.
      if (cancelSubscriptionId && config.STRIPE_SECRET_KEY) {
        await cancelReplacedSubscription(
          memberId,
          cancelSubscriptionId,
          config.STRIPE_SECRET_KEY
        );
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
