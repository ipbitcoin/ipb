import { randomInt } from "node:crypto";

import { api } from "@ipb/backend/api";

/**
 * Email a one-time code to an IPB member so they can unlock the member price.
 * Always answers `{ ok: true }` — whether or not the email belongs to a member
 * — so this endpoint can't be used to find out who is a member. Convex queues
 * the email in the same mutation, so both cases take the same time too.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody<{ email?: string; locale?: string } | undefined>(
    event
  );
  const email = body?.email?.trim();

  if (!(email && EMAIL_REGEX.test(email))) {
    throw createError({ message: "Invalid email address", statusCode: 400 });
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await convexClient().mutation(api.memberVerification.request, {
    code,
    codeHash: hashCode(email, code),
    email,
    locale: body?.locale === "en" ? "en" : "pt",
    serviceKey: config.SERVICE_KEY,
  });

  // Local dev: hand the code back so the flow is testable without email.
  if (import.meta.dev) {
    return { devCode: code, ok: true };
  }
  return { ok: true };
});
