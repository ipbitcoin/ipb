import { api } from "@ipb/backend/api";

/** Where to send the admin back to: the redirect asked for if registered, or the only one there is. */
function redirectFor(
  registered: string[],
  asked: string | null
): string | undefined {
  if (!asked) {
    return registered.length === 1 ? registered[0] : undefined;
  }
  return registered.some((uri) => sameRedirect(uri, asked)) ? asked : undefined;
}

/**
 * Checks the app and where it sends people back to, keeps the request, and
 * sends the browser to the consent page. Nothing goes back to the app before
 * an admin agrees: what's wrong shows on the consent page instead.
 */
export default oauthRoute("GET", async (event) => {
  const params = getRequestURL(event).searchParams;
  const { SERVICE_KEY: serviceKey } = useRuntimeConfig(event);
  const convex = convexClient();

  const clientId = params.get("client_id") ?? "";
  const found = clientId
    ? await convex.query(api.oauth.client, { clientId, serviceKey })
    : null;
  if (!found) {
    return connectErrorPage(event, "unknown_app");
  }
  const redirectUri = redirectFor(
    found.redirectUris,
    params.get("redirect_uri")
  );
  if (!redirectUri) {
    return connectErrorPage(event, "bad_redirect");
  }
  const challenge = params.get("code_challenge");
  const resource = params.get("resource");
  const state = params.get("state") ?? undefined;
  if (
    params.get("response_type") !== "code" ||
    !challenge ||
    challenge.length > MAX_PARAM ||
    params.get("code_challenge_method") !== "S256" ||
    (resource && !isThisServer(event, resource)) ||
    (state && state.length > MAX_PARAM)
  ) {
    return connectErrorPage(event, "bad_request");
  }

  const requestId = await convex.mutation(api.oauth.startRequest, {
    clientId: found.clientId,
    codeChallenge: challenge,
    redirectUri,
    serviceKey,
    state,
  });
  return sendRedirect(
    event,
    `${oauthOrigin(event)}${CONNECT_PATH}?request=${requestId}`
  );
});
