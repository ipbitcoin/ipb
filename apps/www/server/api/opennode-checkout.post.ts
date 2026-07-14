export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);

  const { amount, currency = "EUR", locale = "pt" } = body;

  if (!amount || amount < 1) {
    throw createError({ message: "Invalid amount", statusCode: 400 });
  }

  const origin =
    config.APP_URL ||
    getRequestHeader(event, "origin") ||
    getRequestHeader(event, "referer")?.replace(/\/$/, "") ||
    "";

  // ── Dev mode: no OpenNode key configured → simulate success immediately ──
  if (!config.OPENNODE_API_KEY) {
    console.warn(
      "[opennode-checkout] OPENNODE_API_KEY not set — returning dev success redirect"
    );
    const successUrl = `${origin}/${locale === "pt" ? "juntar" : "en/join"}?status=success`;
    return { url: successUrl };
  }

  const response = await $fetch<{ data: { hosted_checkout_url: string } }>(
    "https://api.opennode.com/v1/charges",
    {
      body: {
        amount,
        callback_url: `${origin}/api/opennode-webhook`,
        currency,
        description:
          locale === "pt"
            ? "Donativo ao Instituto Português de Bitcoin"
            : "Donation to the Portuguese Bitcoin Institute",
        success_url: `${origin}/${locale === "pt" ? "juntar" : "en/join"}?status=success`,
      },
      headers: {
        Authorization: config.OPENNODE_API_KEY,
        "Content-Type": "application/json",
      },
      method: "POST",
    }
  );

  return { url: response.data.hosted_checkout_url };
});
