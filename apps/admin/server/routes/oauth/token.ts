import { api } from "@ipb/backend/api";
import type { FunctionReturnType } from "convex/server";

/** Issues tokens for a code, or for a refresh token in trade. */
export default oauthRoute("POST", async (event) => {
  const form = await readOAuthForm(event);
  const found = await authenticateClient(event, form);
  if (!found) {
    return invalidClient(event);
  }
  const resource = form.get("resource");
  if (resource && !isThisServer(event, resource)) {
    return oauthError(
      event,
      "invalid_target",
      `The resource must be ${mcpUrl(event)}.`
    );
  }

  const { SERVICE_KEY: serviceKey } = useRuntimeConfig(event);
  const convex = convexClient();
  const accessToken = newSecret("ipbat");
  const refreshToken = newSecret("ipbrt");
  const accessHash = hashSecret(accessToken);
  const refreshHash = hashSecret(refreshToken);

  const grantType = form.get("grant_type");
  let result: FunctionReturnType<typeof api.oauth.redeem>;
  if (grantType === "authorization_code") {
    const codeHash = hashSecret(form.get("code") ?? "");
    const pending = await convex.query(api.oauth.codeRequest, {
      codeHash,
      serviceKey,
    });
    if (
      !(
        pending &&
        pkceMatches(form.get("code_verifier") ?? "", pending.codeChallenge)
      )
    ) {
      return oauthError(
        event,
        "invalid_grant",
        "The code or its verifier is wrong."
      );
    }
    const redirectUri = form.get("redirect_uri") ?? pending.redirectUri;
    result = await convex.mutation(api.oauth.redeem, {
      accessHash,
      clientId: found.clientId,
      clientSite: redirectSite(pending.redirectUri),
      codeHash,
      redirectUri,
      refreshHash,
      serviceKey,
    });
  } else if (grantType === "refresh_token") {
    result = await convex.mutation(api.oauth.refresh, {
      accessHash,
      clientId: found.clientId,
      refreshHash,
      serviceKey,
      tokenHash: hashSecret(form.get("refresh_token") ?? ""),
    });
  } else {
    return oauthError(
      event,
      "unsupported_grant_type",
      "Use authorization_code or refresh_token."
    );
  }

  if (!result.ok) {
    return oauthError(event, result.error, result.description);
  }
  return {
    access_token: accessToken,
    expires_in: result.expiresIn,
    refresh_token: refreshToken,
    scope: result.scope,
    token_type: "Bearer",
  };
});
