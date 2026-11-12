import { api } from "@ipb/backend/api";

/** The admin turns the app away; it hears so at its redirect. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const { request } = await readBody<{ request?: unknown }>(event);
  if (typeof request !== "string") {
    throw createError({ message: "request required", statusCode: 400 });
  }
  const found = await convexClient().mutation(api.oauth.deny, {
    requestId: request,
    serviceKey: useRuntimeConfig(event).SERVICE_KEY,
  });
  return {
    redirect: found
      ? redirectWith(found.redirectUri, {
          error: "access_denied",
          error_description: "The admin didn't let the app in.",
          iss: oauthOrigin(event),
          state: found.state,
        })
      : null,
  };
});
