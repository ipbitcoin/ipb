import { randomBytes } from "node:crypto";

import { api } from "@ipb/backend/api";

/**
 * Start a newsletter sign-up. Nothing is delivered until the person clicks the
 * confirmation link Convex emails them. Always answers the same, so this
 * endpoint can't be used to find out who is already subscribed.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const locale = body?.locale === "en" ? "en" : "pt";

  if (!EMAIL_REGEX.test(email)) {
    throw createError({ message: "Invalid email address", statusCode: 400 });
  }

  const origin =
    config.APP_URL ||
    getRequestHeader(event, "origin") ||
    getRequestHeader(event, "referer")?.replace(/\/$/, "") ||
    "";
  const token = randomBytes(32).toString("hex");
  const confirmUrl = `${origin}${locale === "pt" ? "/newsletter/confirmar" : "/en/newsletter/confirm"}?token=${token}`;

  await convexClient().mutation(api.newsletters.requestSubscription, {
    confirmUrl,
    email,
    locale,
    serviceKey: config.SERVICE_KEY,
    tokenHash: hashToken(token),
  });

  // Local dev: hand the link back so the flow is testable without email.
  if (import.meta.dev) {
    return { devLink: confirmUrl, pendingConfirmation: true };
  }
  return { pendingConfirmation: true };
});
