import { api } from "@ipb/backend/api";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);

  const {
    name,
    dateOfBirth,
    citizenCardNumber,
    fiscalNumber,
    address,
    email,
    paymentPlan,
    locale = "pt",
  } = body;

  // Validate required fields (dateOfBirth, citizenCardNumber, fiscalNumber, address are optional)
  if (!name || !email) {
    throw createError({
      message: "Name and email are required",
      statusCode: 400,
    });
  }

  if (!paymentPlan || !["annual", "monthly"].includes(paymentPlan)) {
    throw createError({ message: "Invalid payment plan", statusCode: 400 });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw createError({ message: "Invalid email address", statusCode: 400 });
  }

  const isDev = !config.STRIPE_SECRET_KEY;
  const convex = convexClient();

  // Save member to Convex.
  // In dev mode set status to active immediately (no real payment).
  let memberId: string;

  try {
    memberId = await convex.mutation(api.members.create, {
      address: address || undefined,
      birthday: dateOfBirth || undefined,
      citizenCardNumber: citizenCardNumber || undefined,
      email,
      fiscalNumber: fiscalNumber || undefined,
      name,
      paymentPlan: paymentPlan === "annual" ? "yearly" : "monthly",
      paymentStatus: isDev ? "active" : "pending",
      serviceKey: config.SERVICE_KEY,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[member-register] Convex error:", message);

    if (message.toLowerCase().includes("unique")) {
      throw createError({
        message:
          locale === "pt"
            ? "Este email ou número fiscal já está registado."
            : "This email or fiscal number is already registered.",
        statusCode: 400,
      });
    }
    throw createError({ message: "Error saving member data", statusCode: 500 });
  }

  // Create Stripe checkout session for membership payment
  const origin =
    config.APP_URL ||
    getRequestHeader(event, "origin") ||
    getRequestHeader(event, "referer")?.replace(/\/$/, "") ||
    "";

  const params = new URLSearchParams();
  params.append("payment_method_types[]", "card");
  params.append("customer_email", email);
  params.append("line_items[0][price_data][currency]", "eur");
  params.append(
    "line_items[0][price_data][product_data][name]",
    locale === "pt" ? "Membro IPB – Quota Anual" : "IPB Member – Annual Fee"
  );
  params.append(
    "line_items[0][price_data][product_data][description]",
    locale === "pt"
      ? "Instituto Português de Bitcoin"
      : "Portuguese Bitcoin Institute"
  );
  params.append(
    "success_url",
    `${origin}/${locale === "pt" ? "juntar" : "en/join"}?status=member-success`
  );
  params.append(
    "cancel_url",
    `${origin}/${locale === "pt" ? "juntar" : "en/join"}?status=member-cancel`
  );

  // Pass member id as metadata for webhook reconciliation
  params.append("metadata[memberId]", memberId);
  params.append("metadata[type]", "membership");

  params.append("mode", "subscription");
  if (paymentPlan === "monthly") {
    // Monthly subscription: ~20.83€/month (250€ / 12)
    params.append("line_items[0][price_data][unit_amount]", "2083");
    params.append("line_items[0][price_data][recurring][interval]", "month");
    params.append("line_items[0][price_data][recurring][interval_count]", "1");
  } else {
    // Annual subscription: 250€/year
    params.append("line_items[0][price_data][unit_amount]", "25000");
    params.append("line_items[0][price_data][recurring][interval]", "year");
    params.append("line_items[0][price_data][recurring][interval_count]", "1");
  }

  params.append("line_items[0][quantity]", "1");

  // ── Dev mode: no Stripe key → simulate success immediately ──
  if (!config.STRIPE_SECRET_KEY) {
    console.warn(
      "[member-register] STRIPE_SECRET_KEY not set — returning dev success redirect"
    );
    return {
      url: `${origin}/${locale === "pt" ? "juntar" : "en/join"}?status=member-success`,
    };
  }

  try {
    const response = await $fetch<{ url: string }>(
      "https://api.stripe.com/v1/checkout/sessions",
      {
        body: params.toString(),
        headers: {
          Authorization: `Bearer ${config.STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        method: "POST",
      }
    );

    return { url: response.url };
  } catch {
    throw createError({
      message: "Error creating payment session",
      statusCode: 500,
    });
  }
});
