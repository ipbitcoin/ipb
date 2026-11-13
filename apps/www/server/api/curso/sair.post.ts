import { api } from "@ipb/backend/api";

export default defineEventHandler(async (event) => {
  const token = sessionToken(event);
  if (token) {
    try {
      await convexClient().mutation(api.courses.endSession, {
        serviceKey: useRuntimeConfig().SERVICE_KEY,
        tokenHash: hashToken(token),
      });
    } catch (error: unknown) {
      // The cookie goes away either way; an old session row just expires.
      console.warn("[curso/sair] Could not end the session:", error);
    }
  }
  deleteCookie(event, COURSE_COOKIE, { path: "/" });
  return { ok: true };
});
