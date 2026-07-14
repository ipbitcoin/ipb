import { createHmac } from "node:crypto";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);

  // Verify OpenNode HMAC signature
  // OpenNode signs with: HMAC-SHA256(invoice_id, api_key)
  if (config.OPENNODE_API_KEY) {
    const sig = getRequestHeader(event, "x-opennode-signature") ?? "";
    const expected = createHmac("sha256", config.OPENNODE_API_KEY)
      .update(body.id ?? "")
      .digest("hex");

    if (sig !== expected) {
      console.warn("[opennode-webhook] Invalid signature — ignoring");
      throw createError({ message: "Invalid signature", statusCode: 400 });
    }
  }

  // Only act on settled (fully paid) charges
  if (body.status !== "paid") {
    return { received: true };
  }

  console.info("[opennode-webhook] Charge settled:", {
    amount: body.amount,
    currency: body.currency,
    email: body.customer_email ?? "anonymous",
    id: body.id,
  });

  // Donations via OpenNode are not tied to a Strapi record (often anonymous).
  // Add record lookup here if you introduce a donation content type.

  return { received: true };
});
