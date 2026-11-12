import { api } from "@ipb/backend/api";

/** RFC 7009: an app gives up a token, which disconnects it. Unknown tokens are fine too. */
export default oauthRoute("POST", async (event) => {
  const form = await readOAuthForm(event);
  const found = await authenticateClient(event, form);
  if (!found) {
    return invalidClient(event);
  }
  const token = form.get("token");
  if (token) {
    await convexClient().mutation(api.oauth.revokeToken, {
      clientId: found.clientId,
      hash: hashSecret(token),
      serviceKey: useRuntimeConfig(event).SERVICE_KEY,
    });
  }
  setResponseStatus(event, 200);
  return "";
});
