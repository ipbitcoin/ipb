import { api } from "@ipb/backend/api";

/** Confirm a newsletter sign-up from the emailed link's token. */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody<{ token?: string } | undefined>(event);
  const token = body?.token?.trim();

  if (!(token && /^[a-f0-9]{64}$/.test(token))) {
    throw createError({ message: "Invalid link", statusCode: 400 });
  }

  const { ok } = await convexClient().mutation(api.newsletters.confirm, {
    serviceKey: config.SERVICE_KEY,
    tokenHash: hashToken(token),
  });
  if (!ok) {
    throw createError({ message: "Invalid or expired link", statusCode: 400 });
  }
  return { ok: true };
});
