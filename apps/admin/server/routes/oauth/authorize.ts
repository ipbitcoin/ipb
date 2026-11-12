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
 * sends the browser to the consent page. Until the redirect is known good,
 * errors show here rather than going back to it.
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
    return oauthErrorPage(event, "This app isn't registered with IPB Admin.");
  }
  const redirectUri = redirectFor(
    found.redirectUris,
    params.get("redirect_uri")
  );
  if (!redirectUri) {
    return oauthErrorPage(
      event,
      "This app asked to go back somewhere it didn't register."
    );
  }

  const origin = oauthOrigin(event);
  const state = params.get("state") ?? undefined;
  const fail = (error: string, description: string) =>
    sendRedirect(
      event,
      redirectWith(redirectUri, {
        error,
        error_description: description,
        iss: origin,
        state,
      })
    );
  if (params.get("response_type") !== "code") {
    return fail("unsupported_response_type", "Only code is supported.");
  }
  const challenge = params.get("code_challenge");
  if (!challenge || params.get("code_challenge_method") !== "S256") {
    return fail("invalid_request", "PKCE with S256 is required.");
  }
  const resource = params.get("resource");
  if (resource && !isThisServer(event, resource)) {
    return fail("invalid_target", `The resource must be ${mcpUrl(event)}.`);
  }

  const requestId = await convex.mutation(api.oauth.startRequest, {
    clientId: found.clientId,
    codeChallenge: challenge,
    redirectUri,
    serviceKey,
    state,
  });
  return sendRedirect(event, `${origin}${CONNECT_PATH}?request=${requestId}`);
});
