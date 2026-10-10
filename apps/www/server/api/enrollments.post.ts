import { api } from "@ipb/backend/api";
import type { Id } from "@ipb/backend/dataModel";

interface EnrollmentBody {
  name?: string;
  email?: string;
  phone?: string;
  birthday?: string;
  nif?: string;
  trainingId?: Id<"trainings">;
  participated_workshop?: boolean;
  has_exposure?: boolean;
  bought_bitcoin?: boolean;
  has_self_custody?: boolean;
  expectations?: string;
  memberToken?: string;
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody<EnrollmentBody | undefined>(event);

  const {
    name,
    email,
    phone,
    birthday,
    nif,
    trainingId,
    participated_workshop,
    has_exposure,
    bought_bitcoin,
    has_self_custody,
    expectations,
    memberToken,
  } = body ?? {};

  if (!name || !email || !birthday || !trainingId) {
    throw createError({ message: "Missing required fields", statusCode: 400 });
  }

  if (!config.STRIPE_SECRET_KEY) {
    // Before anything is saved: without Stripe, enrollments auto-confirm.
    assertDevFallback("STRIPE_SECRET_KEY");
  }

  const convex = convexClient();

  // ── Create enrollment (validates training active + stock in the mutation) ──
  let enrollment: {
    enrollmentId: Id<"enrollments">;
    memberLayer?: 1 | 2;
    orderId: string;
    priceEur: number;
  };
  try {
    enrollment = await convex.mutation(api.enrollments.create, {
      birthday,
      boughtBitcoin: bought_bitcoin ?? undefined,
      email,
      expectations: expectations ?? undefined,
      hasExposure: has_exposure ?? undefined,
      hasSelfCustody: has_self_custody ?? undefined,
      memberTokenHash: memberToken ? hashToken(memberToken) : undefined,
      name,
      nif: nif ?? undefined,
      participatedWorkshop: participated_workshop ?? undefined,
      phone: phone ?? undefined,
      trainingId,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("not found")) {
      throw createError({ message: "Training not found", statusCode: 404 });
    }
    if (message.includes("not active")) {
      throw createError({ message: "Training is not active", statusCode: 400 });
    }
    if (message.includes("sold out")) {
      throw createError({ message: "Training is sold out", statusCode: 400 });
    }
    throw createError({
      message: "Failed to create enrollment",
      statusCode: 500,
    });
  }

  // Price is decided server-side (members get their layer's price).
  const { enrollmentId, memberLayer, orderId, priceEur } = enrollment;

  // ── DEV mode: no Stripe key → auto-confirm + decrement stock ─────────
  if (!config.STRIPE_SECRET_KEY) {
    console.warn(
      "[enrollments] STRIPE_SECRET_KEY not set — auto-confirming enrollment"
    );
    await convex
      .mutation(api.enrollments.markPaid, {
        id: enrollmentId,
        serviceKey: config.SERVICE_KEY,
      })
      .catch((error: unknown) => {
        console.error("[enrollments] Failed to auto-confirm (dev):", error);
      });
    return { clientSecret: "", devMode: true, memberLayer, orderId, priceEur };
  }

  // ── Create Stripe PaymentIntent ──────────────────────────────────────
  const params = new URLSearchParams();
  params.append("amount", String(Math.round(priceEur * 100)));
  params.append("currency", "eur");
  params.append("automatic_payment_methods[enabled]", "true");
  params.append("receipt_email", email);
  params.append("description", `Bitcoin para Todos - ${orderId}`);
  params.append("metadata[type]", "enrollment");
  params.append("metadata[enrollmentId]", enrollmentId);
  params.append("metadata[orderId]", orderId);

  const intent = await $fetch<{ id: string; client_secret: string }>(
    "https://api.stripe.com/v1/payment_intents",
    {
      body: params.toString(),
      headers: {
        Authorization: `Bearer ${config.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    }
  );

  // ── Save Stripe id on enrollment ─────────────────────────────────────
  await convex
    .mutation(api.enrollments.setStripeId, {
      id: enrollmentId,
      serviceKey: config.SERVICE_KEY,
      stripeId: intent.id,
    })
    .catch((error: unknown) => {
      console.error("[enrollments] Failed to save stripe_id:", error);
    });

  return {
    clientSecret: intent.client_secret,
    devMode: false,
    memberLayer,
    orderId,
    priceEur,
  };
});
