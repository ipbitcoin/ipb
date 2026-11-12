/** RFC 8414: the authorization server's endpoints and what it supports. */
export default oauthRoute("GET", (event) => {
  const base = oauthOrigin(event);
  return {
    authorization_endpoint: `${base}/oauth/authorize`,
    authorization_response_iss_parameter_supported: true,
    code_challenge_methods_supported: ["S256"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    issuer: base,
    registration_endpoint: `${base}/oauth/register`,
    response_types_supported: ["code"],
    revocation_endpoint: `${base}/oauth/revoke`,
    revocation_endpoint_auth_methods_supported: CLIENT_AUTHS,
    scopes_supported: OAUTH_SCOPES,
    token_endpoint: `${base}/oauth/token`,
    token_endpoint_auth_methods_supported: CLIENT_AUTHS,
  };
});
