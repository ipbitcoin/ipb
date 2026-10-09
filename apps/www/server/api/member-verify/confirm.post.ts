import { randomBytes } from "node:crypto";

import { api } from "@ipb/backend/api";

/** Check the emailed code. On success returns a token that unlocks the member price. */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody<{ code?: string; email?: string } | undefined>(
    event
  );
  const email = body?.email?.trim();
  const code = body?.code?.trim();

  if (!(email && EMAIL_REGEX.test(email) && code && /^\d{6}$/.test(code))) {
    throw createError({ message: "Invalid code", statusCode: 400 });
  }

  const convex = convexClient();
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);

  const { ok } = await convex.mutation(api.memberVerification.confirm, {
    codeHash: hashCode(email, code),
    email,
    serviceKey: config.SERVICE_KEY,
    tokenHash,
  });
  if (!ok) {
    throw createError({ message: "Invalid or expired code", statusCode: 400 });
  }

  const price = await convex.query(api.memberVerification.priceForToken, {
    email,
    serviceKey: config.SERVICE_KEY,
    tokenHash,
  });
  return { token, ...price };
});
