export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);

  const { amount, currency = "eur", mode = "payment", locale = "pt" } = body;

  // mode: 'payment' | 'subscription' (anual) | 'subscription_month' (mensal)
  if (!amount || amount < 1) {
    throw createError({ message: "Invalid amount", statusCode: 400 });
  }

  const origin =
    config.APP_URL ||
    getRequestHeader(event, "origin") ||
    getRequestHeader(event, "referer")?.replace(/\/$/, "") ||
    "";

  // ── Dev mode: no Stripe key configured → simulate success immediately ──
  if (!config.STRIPE_SECRET_KEY) {
    console.warn(
      "[stripe-checkout] STRIPE_SECRET_KEY not set — returning dev success redirect"
    );
    const successUrl = `${origin}/${locale === "pt" ? "juntar" : "en/join"}?status=success`;
    return { url: successUrl };
  }

  const isSubscription =
    mode === "subscription" || mode === "subscription_month";
  const isMonthly = mode === "subscription_month";

  const productName = isSubscription
    ? locale === "pt"
      ? isMonthly
        ? "Donativo ao IPB – Mensal"
        : "Membro IPB – Quota Anual"
      : isMonthly
        ? "IPB Donation – Monthly"
        : "IPB Member – Annual Fee"
    : locale === "pt"
      ? "Donativo ao IPB"
      : "Donation to IPB";

  const productDescription =
    locale === "pt"
      ? "Instituto Português de Bitcoin"
      : "Portuguese Bitcoin Institute";

  const params = new URLSearchParams();
  params.append("payment_method_types[]", "card");
  params.append("line_items[0][price_data][currency]", currency);
  params.append("line_items[0][price_data][product_data][name]", productName);
  params.append(
    "line_items[0][price_data][product_data][description]",
    productDescription
  );
  params.append("line_items[0][price_data][unit_amount]", String(amount * 100));
  params.append("line_items[0][quantity]", "1");
  params.append(
    "success_url",
    `${origin}/${locale === "pt" ? "juntar" : "en/join"}?status=success`
  );
  params.append(
    "cancel_url",
    `${origin}/${locale === "pt" ? "juntar" : "en/join"}?status=cancel`
  );

  if (isSubscription) {
    params.append("mode", "subscription");
    params.append(
      "line_items[0][price_data][recurring][interval]",
      isMonthly ? "month" : "year"
    );
  } else {
    params.append("mode", "payment");
  }

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
});
