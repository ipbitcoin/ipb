import { api } from "@ipb/backend/api";

/** Disconnects one of the admin's apps: its tokens stop working at once. */
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event);
  await convexClient().mutation(api.oauth.disconnect, {
    email: admin.email,
    grantId: getRouterParam(event, "id") ?? "",
    serviceKey: useRuntimeConfig(event).SERVICE_KEY,
  });
  return { ok: true };
});
