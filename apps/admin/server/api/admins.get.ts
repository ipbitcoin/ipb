import { api } from "@ipb/backend/api";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const config = useRuntimeConfig();
  const convex = convexClient();
  return await convex.query(api.adminUsers.listAdmins, {
    serviceKey: config.SERVICE_KEY,
  });
});
