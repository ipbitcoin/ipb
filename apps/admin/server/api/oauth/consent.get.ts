import { api } from "@ipb/backend/api";

/**
 * The app asking to connect and where it sends the admin back to (a domain,
 * an app's own scheme, or LOOPBACK_SITE for one on their computer), or 404
 * once the request is gone.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const { request } = getQuery(event);
  const found =
    typeof request === "string"
      ? await convexClient().query(api.oauth.consent, {
          requestId: request,
          serviceKey: useRuntimeConfig(event).SERVICE_KEY,
        })
      : null;
  if (!found) {
    throw createError({ message: "Pedido expirado", statusCode: 404 });
  }
  return {
    name: found.name ?? "Uma app",
    site: redirectSite(found.redirectUri),
  };
});
