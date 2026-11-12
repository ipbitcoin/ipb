import { api } from "@ipb/backend/api";

/** The AI apps the admin connected, and the address apps connect to. */
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event);
  const connections = await convexClient().query(api.oauth.connections, {
    email: admin.email,
    serviceKey: useRuntimeConfig(event).SERVICE_KEY,
  });
  return { connections, url: mcpUrl(event) };
});
