import { randomBytes } from "node:crypto";

import { api } from "@ipb/backend/api";

/** Checks the emailed code and signs the learner in with a cookie. */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody<{ code?: string; email?: string } | undefined>(
    event
  );
  const email = body?.email?.trim().toLowerCase();
  const code = body?.code?.replaceAll(/\s/g, "");
  if (!(email && EMAIL_REGEX.test(email) && code && /^\d{6}$/.test(code))) {
    throw createError({ message: "Invalid code", statusCode: 400 });
  }

  const token = randomBytes(32).toString("hex");
  const { ok } = await convexClient().mutation(api.courses.confirmLogin, {
    codeHash: hashCode(email, code),
    email,
    serviceKey: config.SERVICE_KEY,
    tokenHash: hashToken(token),
  });
  if (!ok) {
    throw createError({ message: "Invalid or expired code", statusCode: 400 });
  }
  setSessionCookie(event, token);
  return { ok: true };
});
