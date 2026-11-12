/**
 * The pieces of the admin's OAuth 2.1 server, which lets AI apps connect to
 * its MCP server (server/routes/mcp.ts) as the admin who agrees: where it
 * answers, secrets and their hashes, PKCE, redirect URIs and replies. Grants
 * and tokens live in Convex (packages/backend/convex/oauth.ts), by hash.
 */
import { Buffer } from "node:buffer";
import { createHash, randomBytes } from "node:crypto";

import { api } from "@ipb/backend/api";
import type { EventHandlerRequest, H3Event } from "h3";

/** Where the MCP server answers. */
export const MCP_PATH = "/mcp";

/** Where an admin agrees to let an app in. */
export const CONNECT_PATH = "/connect";

/** What a grant can let an app do. */
export const OAUTH_SCOPES = ["read", "write"] as const;

/** How an app proves itself at the token endpoint (RFC 7591). */
export const CLIENT_AUTHS = [
  "none",
  "client_secret_post",
  "client_secret_basic",
] as const;

export type ClientAuth = (typeof CLIENT_AUTHS)[number];

export function isClientAuth(value: unknown): value is ClientAuth {
  return CLIENT_AUTHS.some((auth) => auth === value);
}

/** The site of a redirect back to the admin's own computer (loopback). */
export const LOOPBACK_SITE = "localhost";

/** Longest redirect URI or `state` taken from an app. */
export const MAX_PARAM = 2048;
/** Largest request body read from an app. */
const MAX_BODY = 64 * 1024;

/**
 * The admin's public address, which tokens are issued for: SITE_URL. Only in
 * development does it fall back to the address the request came to, since
 * outside it that would follow whatever Host header was sent.
 */
export function oauthOrigin(event: H3Event): string {
  const configured = String(useRuntimeConfig(event).SITE_URL ?? "");
  if (!(configured || import.meta.dev)) {
    throw createError({
      message: "SITE_URL isn't set, so AI apps can't connect.",
      statusCode: 500,
    });
  }
  const origin =
    configured ||
    getRequestURL(event, { xForwardedHost: true, xForwardedProto: true })
      .origin;
  return origin.replace(/\/+$/u, "");
}

export function mcpUrl(event: H3Event): string {
  return `${oauthOrigin(event)}${MCP_PATH}`;
}

/** A new secret: a token, code or client secret, with a prefix saying which. */
export function newSecret(prefix: string): string {
  return `${prefix}_${randomBytes(32).toString("base64url")}`;
}

/** What's kept of a secret: its SHA-256, in hex. */
export function hashSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}

const VERIFIER = /^[\w.~-]{43,128}$/u;

/** Whether the verifier the app sends matches the S256 challenge it started with. */
export function pkceMatches(verifier: string, challenge: string): boolean {
  return (
    VERIFIER.test(verifier) &&
    createHash("sha256").update(verifier).digest("base64url") === challenge
  );
}

/** Schemes no redirect may use: they'd run or read something instead of opening an app. */
const BLOCKED_SCHEMES = new Set([
  "about:",
  "blob:",
  "data:",
  "file:",
  // oxlint-disable-next-line no-script-url -- listed to refuse it.
  "javascript:",
  "vbscript:",
]);

function parseUrl(uri: string): URL | null {
  try {
    return new URL(uri);
  } catch {
    return null;
  }
}

function isLoopback(url: URL): boolean {
  return (
    url.protocol === "http:" &&
    ["127.0.0.1", "[::1]", "localhost"].includes(url.hostname)
  );
}

/**
 * Whether an app may register the redirect: `https`, plain `http` only back to
 * the same device, or an app's own scheme like `cursor://`.
 */
export function allowedRedirect(uri: string): boolean {
  if (uri.length > MAX_PARAM) {
    return false;
  }
  const url = parseUrl(uri);
  if (!url || url.hash || BLOCKED_SCHEMES.has(url.protocol)) {
    return false;
  }
  return url.protocol === "http:" ? isLoopback(url) : true;
}

/** Whether the redirect asked for is one registered: exactly, or on another port of the device (RFC 8252). */
export function sameRedirect(registered: string, asked: string): boolean {
  if (registered === asked) {
    return true;
  }
  const a = parseUrl(registered);
  const b = parseUrl(asked);
  return Boolean(
    a &&
    b &&
    isLoopback(a) &&
    isLoopback(b) &&
    a.hostname === b.hostname &&
    a.pathname === b.pathname &&
    a.search === b.search
  );
}

/** Where the redirect goes, as people know it: a domain, this device, or an app. */
export function redirectSite(uri: string): string {
  const url = parseUrl(uri);
  if (!url) {
    return uri;
  }
  if (isLoopback(url)) {
    return LOOPBACK_SITE;
  }
  return url.protocol === "https:" ? url.hostname : `${url.protocol}//`;
}

/** The redirect with OAuth's answer added to its query. */
export function redirectWith(
  uri: string,
  params: Record<string, string | undefined>
): string {
  const url = new URL(uri);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

/** Lets MCP clients that run in a browser, like the MCP Inspector, reach the endpoints. */
const CORS: Record<string, string> = {
  "Access-Control-Allow-Headers":
    "Authorization, Content-Type, Mcp-Protocol-Version, Mcp-Session-Id, Last-Event-ID",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Expose-Headers": "WWW-Authenticate, Mcp-Session-Id",
  "Access-Control-Max-Age": "86400",
};

/**
 * An endpoint apps call: open to browsers, never cached, answering preflights
 * and turning other methods away.
 */
export function oauthRoute(
  method: "GET" | "POST",
  handler: (event: H3Event<EventHandlerRequest>) => unknown
) {
  return defineEventHandler(async (event) => {
    setResponseHeaders(event, { ...CORS, "Cache-Control": "no-store" });
    if (event.method === "OPTIONS") {
      setResponseStatus(event, 204);
      return null;
    }
    if (event.method !== method) {
      setResponseHeader(event, "Allow", `${method}, OPTIONS`);
      setResponseStatus(event, 405);
      return `Only ${method} is supported.`;
    }
    return await handler(event);
  });
}

/** An OAuth error reply (RFC 6749 section 5.2). */
export function oauthError(
  event: H3Event,
  error: string,
  description: string,
  status = 400
) {
  setResponseStatus(event, status);
  return { error, error_description: description };
}

/** Why an app's request to connect was turned away before an admin saw it. */
export type ConnectError = "unknown_app" | "bad_redirect" | "bad_request";

/**
 * Shows the admin, on the consent page, a request that can't go ahead. It
 * never goes back to the app's redirect: before an admin agrees, that could be
 * any site an app registered, and the admin's domain would send people there.
 */
export function connectErrorPage(event: H3Event, error: ConnectError) {
  return sendRedirect(
    event,
    `${oauthOrigin(event)}${CONNECT_PATH}?error=${error}`
  );
}

/** The app couldn't be identified at the token or revocation endpoint (RFC 6749 section 5.2). */
export function invalidClient(event: H3Event) {
  if (/^basic /iu.test(getHeader(event, "authorization") ?? "")) {
    setResponseHeader(event, "WWW-Authenticate", 'Basic realm="IPB Admin"');
  }
  return oauthError(
    event,
    "invalid_client",
    "The app couldn't be identified.",
    401
  );
}

/** The bearer token the request carries, or "" for none. */
export function bearerToken(event: H3Event): string {
  const header = getHeader(event, "authorization") ?? "";
  return /^bearer /iu.test(header) ? header.slice(7).trim() : "";
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The request's body as text, refusing ones too large to be an app's. */
export async function readBodyText(event: H3Event): Promise<string> {
  const declared = Number(getHeader(event, "content-length") ?? 0);
  const tooLarge = createError({
    message: "The request is too large.",
    statusCode: 413,
  });
  if (declared > MAX_BODY) {
    throw tooLarge;
  }
  const text = (await readRawBody(event, "utf-8")) ?? "";
  if (text.length > MAX_BODY) {
    throw tooLarge;
  }
  return text;
}

/** The request's JSON body as an object, or null when it isn't one. */
export async function readJsonObject(
  event: H3Event
): Promise<Record<string, unknown> | null> {
  const text = await readBodyText(event);
  try {
    const value: unknown = JSON.parse(text);
    return isRecord(value) ? value : null;
  } catch {
    return null;
  }
}

/** The request's form, sent as `application/x-www-form-urlencoded` or, by some apps, as JSON. */
export async function readOAuthForm(
  event: H3Event
): Promise<Map<string, string>> {
  const type = getHeader(event, "content-type") ?? "";
  if (type.includes("application/json")) {
    const body = await readJsonObject(event);
    return new Map(
      Object.entries(body ?? {}).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string"
      )
    );
  }
  return new Map(new URLSearchParams(await readBodyText(event)));
}

/** The app at the token or revocation endpoint, checked against its secret when it has one. */
export async function authenticateClient(
  event: H3Event,
  form: Map<string, string>
) {
  let clientId = form.get("client_id");
  let secret = form.get("client_secret");
  const header = getHeader(event, "authorization") ?? "";
  if (/^basic /iu.test(header)) {
    const pair = Buffer.from(header.slice(6), "base64").toString("utf-8");
    const colon = pair.indexOf(":");
    try {
      clientId = decodeURIComponent(colon === -1 ? pair : pair.slice(0, colon));
      secret =
        colon === -1 ? undefined : decodeURIComponent(pair.slice(colon + 1));
    } catch {
      return null;
    }
  }
  if (!clientId) {
    return null;
  }
  const found = await convexClient().query(api.oauth.client, {
    clientId,
    serviceKey: useRuntimeConfig(event).SERVICE_KEY,
  });
  if (!found) {
    return null;
  }
  if (found.auth === "none") {
    return found;
  }
  return secret && hashSecret(secret) === found.secretHash ? found : null;
}

/** RFC 9728: the MCP server, and the authorization server its tokens come from. */
export function protectedResource(event: H3Event) {
  return {
    authorization_servers: [oauthOrigin(event)],
    bearer_methods_supported: ["header"],
    resource: mcpUrl(event),
    resource_name: "IPB Admin",
    scopes_supported: OAUTH_SCOPES,
  };
}

/** Whether a resource indicator names this MCP server, give or take a slash. */
export function isThisServer(event: H3Event, resource: string): boolean {
  return resource.replace(/\/+$/u, "") === mcpUrl(event);
}
