import { randomInt } from "node:crypto";

import { api } from "@ipb/backend/api";

/**
 * Emails a one-time code to an address that bought a course. Always answers
 * `{ ok: true }`, whether or not the address is a customer.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody<{ email?: string; locale?: string } | undefined>(
    event
  );
  const email = body?.email?.trim().toLowerCase();
  if (!(email && EMAIL_REGEX.test(email))) {
    throw createError({ message: "Invalid email address", statusCode: 400 });
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await convexClient().mutation(api.courses.requestLogin, {
    code,
    codeHash: hashCode(email, code),
    email,
    locale: body?.locale === "en" ? "en" : "pt",
    serviceKey: config.SERVICE_KEY,
  });

  // Local dev: hand the code back so the flow can be tried without email.
  if (import.meta.dev) {
    return { devCode: code, ok: true };
  }
  return { ok: true };
});
