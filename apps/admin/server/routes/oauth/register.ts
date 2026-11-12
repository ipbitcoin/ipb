import { api } from "@ipb/backend/api";

const MAX_NAME = 100;
const MAX_REDIRECTS = 10;

/** A name an app gave itself, kept short and on one line. */
function cleanName(name: unknown): string {
  const text =
    typeof name === "string"
      ? name
          .replaceAll(/\p{Cc}/gu, " ")
          .trim()
          .slice(0, MAX_NAME)
      : "";
  return text || "App";
}

/** The redirect URIs, when there are some and every one is allowed. */
function cleanRedirects(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }
  const uris = value
    .slice(0, MAX_REDIRECTS)
    .filter((uri): uri is string => typeof uri === "string");
  return uris.length === Math.min(value.length, MAX_REDIRECTS) &&
    uris.every(allowedRedirect)
    ? [...new Set(uris)]
    : null;
}

/** RFC 7591: an app registers itself, and gets a client id (and a secret, if it wants one). */
export default oauthRoute("POST", async (event) => {
  const body = await readJsonObject(event);
  if (!body) {
    return oauthError(
      event,
      "invalid_client_metadata",
      "Send the metadata as JSON."
    );
  }
  const redirectUris = cleanRedirects(body.redirect_uris);
  if (!redirectUris) {
    return oauthError(
      event,
      "invalid_redirect_uri",
      "Redirect URIs must be https, http to this device, or an app's own scheme."
    );
  }
  const grantTypes = body.grant_types;
  if (Array.isArray(grantTypes) && !grantTypes.includes("authorization_code")) {
    return oauthError(
      event,
      "invalid_client_metadata",
      "Only the authorization code grant is supported."
    );
  }
  const auth = body.token_endpoint_auth_method ?? "none";
  if (!isClientAuth(auth)) {
    return oauthError(
      event,
      "invalid_client_metadata",
      `Supported auth methods: ${CLIENT_AUTHS.join(", ")}.`
    );
  }
  const clientId = newSecret("ipbc");
  const secret = auth === "none" ? undefined : newSecret("ipbcs");
  const name = cleanName(body.client_name);
  await convexClient().mutation(api.oauth.registerClient, {
    auth,
    clientId,
    name,
    redirectUris,
    secretHash: secret ? hashSecret(secret) : undefined,
    serviceKey: useRuntimeConfig(event).SERVICE_KEY,
  });
  setResponseStatus(event, 201);
  return {
    client_id: clientId,
    client_id_issued_at: Math.floor(Date.now() / 1000),
    client_name: name,
    grant_types: ["authorization_code", "refresh_token"],
    redirect_uris: redirectUris,
    response_types: ["code"],
    token_endpoint_auth_method: auth,
    ...(secret ? { client_secret: secret, client_secret_expires_at: 0 } : {}),
  };
});
