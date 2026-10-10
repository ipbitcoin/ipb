import { createHmac, timingSafeEqual } from "node:crypto";

import { api } from "@ipb/backend/api";

/** Svix signature check (Resend webhooks): HMAC-SHA256 over `id.timestamp.body`. */
function verifySvixSignature(
  rawBody: string,
  headers: { id: string; signature: string; timestamp: string },
  secret: string
): boolean {
  const age = Math.abs(Date.now() / 1000 - Number(headers.timestamp));
  if (!Number.isFinite(age) || age > 5 * 60) {
    return false;
  }

  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key)
    .update(`${headers.id}.${headers.timestamp}.${rawBody}`, "utf-8")
    .digest();

  // Header holds one or more space-separated "v1,<base64>" signatures.
  return headers.signature.split(" ").some((part) => {
    const [version, signature] = part.split(",");
    if (version !== "v1" || !signature) {
      return false;
    }
    const received = Buffer.from(signature, "base64");
    return (
      received.length === expected.length && timingSafeEqual(received, expected)
    );
  });
}

/** Resend → Convex: record newsletter unsubscribes made through the email link. */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  if (!config.RESEND_WEBHOOK_SECRET) {
    throw createError({
      message: "Resend webhook not configured",
      statusCode: 503,
    });
  }

  const rawBody = (await readRawBody(event, "utf-8")) ?? "";
  const valid = verifySvixSignature(
    rawBody,
    {
      id: getRequestHeader(event, "svix-id") ?? "",
      signature: getRequestHeader(event, "svix-signature") ?? "",
      timestamp: getRequestHeader(event, "svix-timestamp") ?? "",
    },
    config.RESEND_WEBHOOK_SECRET
  );
  if (!valid) {
    throw createError({ message: "Invalid signature", statusCode: 400 });
  }

  const payload = JSON.parse(rawBody);
  // Only act on opt-outs. Our own syncs also fire contact.updated (with
  // unsubscribed: false) and must not loop back.
  if (
    payload.type === "contact.updated" &&
    payload.data?.unsubscribed === true &&
    typeof payload.data.email === "string"
  ) {
    await convexClient().mutation(api.newsletters.markUnsubscribed, {
      email: payload.data.email,
      serviceKey: config.SERVICE_KEY,
    });
  }

  return { received: true };
});
