import { randomBytes } from "node:crypto";

import { api } from "@ipb/backend/api";

const MAX_AGE_S = 24 * 60 * 60;

/**
 * Called by the page Stripe sends the buyer back to. Checks the Checkout
 * Session with Stripe (never trusts the URL), marks the order paid (the
 * webhook may be late) and signs the buyer in: paying proved the email.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody<{ session_id?: string } | undefined>(event);
  const sessionId = body?.session_id?.trim() ?? "";
  if (!/^[\w-]{8,200}$/.test(sessionId)) {
    throw createError({ message: "Invalid session", statusCode: 400 });
  }

  const convex = convexClient();
  const serviceKey = config.SERVICE_KEY;
  let orderId = "";
  let stripeSessionId: string | undefined;

  if (!config.STRIPE_SECRET_KEY && sessionId.startsWith("dev_")) {
    orderId = sessionId.slice(4); // dev mode only: there is no Stripe to ask
  } else {
    const session = await $fetch<{
      created: number;
      id: string;
      metadata?: { orderId?: string; type?: string };
      payment_status: string;
    }>(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${config.STRIPE_SECRET_KEY}` },
    }).catch(() => null);

    if (
      !session ||
      session.metadata?.type !== "course" ||
      !session.metadata.orderId ||
      session.payment_status !== "paid" ||
      Date.now() / 1000 - session.created > MAX_AGE_S
    ) {
      throw createError({ message: "Payment not confirmed", statusCode: 402 });
    }
    orderId = session.metadata.orderId;
    stripeSessionId = session.id;
  }

  await convex.mutation(api.courses.markPaid, {
    orderId,
    serviceKey,
    stripeSessionId,
  });
  const order = await convex.query(api.courses.getOrder, {
    orderId,
    serviceKey,
  });
  if (order?.paymentStatus !== "paid") {
    throw createError({ message: "Payment not confirmed", statusCode: 402 });
  }

  const token = randomBytes(32).toString("hex");
  const { ok } = await convex.mutation(api.courses.startSessionAfterPurchase, {
    email: order.email,
    serviceKey,
    tokenHash: hashToken(token),
  });
  if (!ok) {
    throw createError({ message: "Could not sign in", statusCode: 500 });
  }
  setSessionCookie(event, token);
  return { course: order.courseSlug, email: order.email, ok: true };
});
