import { ConvexError, v } from "convex/values";

import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { internalMutation, mutation, query } from "./_generated/server";
import { assertServiceKey } from "./lib";

/**
 * The storage behind the admin app's OAuth 2.1 server, which lets AI apps
 * connect to its MCP server as the admin who agrees. The admin app answers
 * the endpoints (apps/admin/server/routes/oauth, /mcp) and makes every secret;
 * only their SHA-256 hashes reach here.
 */

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;
/** How long an access token lasts. */
const ACCESS_MS = 60 * MINUTE;
/** How long a refresh token lasts. Each use trades it for a new one. */
const REFRESH_MS = 30 * DAY;
/** How long an admin has to agree, and the app to trade the code it got. */
const REQUEST_MS = 10 * MINUTE;
/** A registered app nobody ever connected is dropped after this long. */
const UNUSED_CLIENT_MS = 30 * DAY;
/**
 * A refresh token shown again this soon after its trade is taken for a retry
 * (a lost response, two of the app's windows at once) and only refused; later
 * it's taken for a copy, and the whole grant goes.
 */
const REUSE_GRACE_MS = 30 * 1000;
/** Last use is written at most this often. */
const TOUCH_MS = MINUTE;
/** Rows a cleanup run deletes before it schedules another. */
const BATCH = 500;

const clientAuth = v.union(
  v.literal("none"),
  v.literal("client_secret_post"),
  v.literal("client_secret_basic")
);

function scopeOf(write: boolean): string {
  return write ? "read write" : "read";
}

async function activeAdmin(
  ctx: QueryCtx,
  email: string
): Promise<Doc<"adminUsers"> | null> {
  const admin = await ctx.db
    .query("adminUsers")
    .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
    .unique();
  return admin?.active ? admin : null;
}

/** Disconnects an app: its grant and tokens go. */
async function dropGrant(
  ctx: MutationCtx,
  grantId: Id<"mcpGrants">
): Promise<void> {
  const tokens = await ctx.db
    .query("mcpTokens")
    .withIndex("by_grant", (q) => q.eq("grantId", grantId))
    .collect();
  for (const token of tokens) {
    await ctx.db.delete(token._id);
  }
  if (await ctx.db.get(grantId)) {
    await ctx.db.delete(grantId);
  }
}

async function addTokens(
  ctx: MutationCtx,
  grantId: Id<"mcpGrants">,
  accessHash: string,
  refreshHash: string
): Promise<void> {
  const now = Date.now();
  await ctx.db.insert("mcpTokens", {
    expiresAt: now + ACCESS_MS,
    grantId,
    hash: accessHash,
    kind: "access",
  });
  await ctx.db.insert("mcpTokens", {
    expiresAt: now + REFRESH_MS,
    grantId,
    hash: refreshHash,
    kind: "refresh",
  });
}

// Clients

export const client = query({
  args: { clientId: v.string(), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    return await ctx.db
      .query("oauthClients")
      .withIndex("by_client_id", (q) => q.eq("clientId", args.clientId))
      .unique();
  },
});

export const registerClient = mutation({
  args: {
    auth: clientAuth,
    clientId: v.string(),
    name: v.string(),
    redirectUris: v.array(v.string()),
    secretHash: v.optional(v.string()),
    serviceKey: v.string(),
  },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const { serviceKey: _serviceKey, ...fields } = args;
    await ctx.db.insert("oauthClients", fields);
  },
});

// Authorizing

export const startRequest = mutation({
  args: {
    clientId: v.string(),
    codeChallenge: v.string(),
    redirectUri: v.string(),
    serviceKey: v.string(),
    state: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const { serviceKey: _serviceKey, ...fields } = args;
    return await ctx.db.insert("oauthRequests", {
      ...fields,
      expiresAt: Date.now() + REQUEST_MS,
    });
  },
});

/** A request still waiting for an admin to agree, or null once it's gone, used or old. */
async function pendingRequest(
  ctx: QueryCtx,
  requestId: string
): Promise<Doc<"oauthRequests"> | null> {
  const id = ctx.db.normalizeId("oauthRequests", requestId);
  const request = id && (await ctx.db.get(id));
  return request && !request.approval && request.expiresAt > Date.now()
    ? request
    : null;
}

/** What the consent page shows: the app and where it sends the admin back to. */
export const consent = query({
  args: { requestId: v.string(), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const request = await pendingRequest(ctx, args.requestId);
    if (!request) {
      return null;
    }
    const app = await ctx.db
      .query("oauthClients")
      .withIndex("by_client_id", (q) => q.eq("clientId", request.clientId))
      .unique();
    return { name: app?.name, redirectUri: request.redirectUri };
  },
});

/** The admin lets the app in; the request now waits for the code's trade. */
export const approve = mutation({
  args: {
    codeHash: v.string(),
    email: v.string(),
    requestId: v.string(),
    serviceKey: v.string(),
    write: v.boolean(),
  },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const admin = await activeAdmin(ctx, args.email);
    if (!admin) {
      throw new ConvexError("Sessão inválida. Entre de novo.");
    }
    const request = await pendingRequest(ctx, args.requestId);
    if (!request) {
      // Answered already or expired: the consent page shows it as gone.
      return null;
    }
    await ctx.db.patch(request._id, {
      approval: { adminId: admin._id, write: args.write },
      codeHash: args.codeHash,
      expiresAt: Date.now() + REQUEST_MS,
    });
    return { redirectUri: request.redirectUri, state: request.state };
  },
});

/** The admin turns the app away; null when the request is already gone. */
export const deny = mutation({
  args: { requestId: v.string(), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const request = await pendingRequest(ctx, args.requestId);
    if (!request) {
      return null;
    }
    await ctx.db.delete(request._id);
    return { redirectUri: request.redirectUri, state: request.state };
  },
});

// Tokens

const vExchange = v.union(
  v.object({ expiresIn: v.number(), ok: v.literal(true), scope: v.string() }),
  v.object({ description: v.string(), error: v.string(), ok: v.literal(false) })
);

/** The code's request, for the token endpoint to check PKCE against before redeeming it. */
export const codeRequest = query({
  args: { codeHash: v.string(), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const request = await ctx.db
      .query("oauthRequests")
      .withIndex("by_code", (q) => q.eq("codeHash", args.codeHash))
      .unique();
    return request
      ? {
          codeChallenge: request.codeChallenge,
          redirectUri: request.redirectUri,
        }
      : null;
  },
});

/** Trades a code, once, for the grant it stands for and its first tokens. */
export const redeem = mutation({
  args: {
    accessHash: v.string(),
    clientId: v.string(),
    clientSite: v.string(),
    codeHash: v.string(),
    redirectUri: v.string(),
    refreshHash: v.string(),
    serviceKey: v.string(),
  },
  returns: vExchange,
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const invalid = {
      description: "The code is unknown, used or expired.",
      error: "invalid_grant",
      ok: false as const,
    };
    const request = await ctx.db
      .query("oauthRequests")
      .withIndex("by_code", (q) => q.eq("codeHash", args.codeHash))
      .unique();
    if (!request?.approval) {
      return invalid;
    }
    // One use, whatever comes of it.
    await ctx.db.delete(request._id);
    if (
      request.expiresAt <= Date.now() ||
      request.clientId !== args.clientId ||
      request.redirectUri !== args.redirectUri
    ) {
      return invalid;
    }
    const admin = await ctx.db.get(request.approval.adminId);
    if (!admin?.active) {
      return invalid;
    }
    const app = await ctx.db
      .query("oauthClients")
      .withIndex("by_client_id", (q) => q.eq("clientId", request.clientId))
      .unique();
    // Connecting the same app again replaces what it had.
    const earlier = await ctx.db
      .query("mcpGrants")
      .withIndex("by_client", (q) => q.eq("clientId", request.clientId))
      .collect();
    for (const grant of earlier) {
      if (grant.adminId === admin._id) {
        await dropGrant(ctx, grant._id);
      }
    }
    if (app && app.connectedAt === undefined) {
      await ctx.db.patch(app._id, { connectedAt: Date.now() });
    }
    const grantId = await ctx.db.insert("mcpGrants", {
      adminId: admin._id,
      clientId: request.clientId,
      clientName: app?.name ?? "App",
      clientSite: args.clientSite,
      write: request.approval.write,
    });
    await addTokens(ctx, grantId, args.accessHash, args.refreshHash);
    return {
      expiresIn: ACCESS_MS / 1000,
      ok: true as const,
      scope: scopeOf(request.approval.write),
    };
  },
});

/**
 * Trades a refresh token for new tokens. One shown again after it was traded
 * was copied, so the whole grant goes (RFC 9700 section 4.14).
 */
export const refresh = mutation({
  args: {
    accessHash: v.string(),
    clientId: v.string(),
    refreshHash: v.string(),
    serviceKey: v.string(),
    tokenHash: v.string(),
  },
  returns: vExchange,
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const invalid = {
      description: "The refresh token is unknown, used or expired.",
      error: "invalid_grant",
      ok: false as const,
    };
    const token = await ctx.db
      .query("mcpTokens")
      .withIndex("by_hash", (q) => q.eq("hash", args.tokenHash))
      .unique();
    if (token?.kind !== "refresh") {
      return invalid;
    }
    const grant = await ctx.db.get(token.grantId);
    if (!grant || grant.clientId !== args.clientId) {
      return invalid;
    }
    if (token.usedAt !== undefined) {
      if (Date.now() - token.usedAt > REUSE_GRACE_MS) {
        await dropGrant(ctx, grant._id);
      }
      return invalid;
    }
    const admin = await ctx.db.get(grant.adminId);
    if (token.expiresAt <= Date.now() || !admin?.active) {
      return invalid;
    }
    await ctx.db.patch(token._id, { usedAt: Date.now() });
    await addTokens(ctx, grant._id, args.accessHash, args.refreshHash);
    return {
      expiresIn: ACCESS_MS / 1000,
      ok: true as const,
      scope: scopeOf(grant.write),
    };
  },
});

/** An app gives up a token, which disconnects it. Unknown tokens are fine too. */
export const revokeToken = mutation({
  args: { clientId: v.string(), hash: v.string(), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const token = await ctx.db
      .query("mcpTokens")
      .withIndex("by_hash", (q) => q.eq("hash", args.hash))
      .unique();
    const grant = token && (await ctx.db.get(token.grantId));
    if (grant?.clientId === args.clientId) {
      await dropGrant(ctx, grant._id);
    }
  },
});

/** The grant an access token stands for, or null for none. */
export const session = query({
  args: { hash: v.string(), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const token = await ctx.db
      .query("mcpTokens")
      .withIndex("by_hash", (q) => q.eq("hash", args.hash))
      .unique();
    if (token?.kind !== "access" || token.expiresAt <= Date.now()) {
      return null;
    }
    const grant = await ctx.db.get(token.grantId);
    const admin = grant && (await ctx.db.get(grant.adminId));
    if (!(grant && admin?.active)) {
      return null;
    }
    return {
      grantId: grant._id,
      // Stale enough that a call should write when the app was last used.
      stale: !grant.lastUsedAt || Date.now() - grant.lastUsedAt > TOUCH_MS,
      write: grant.write,
    };
  },
});

export const touch = mutation({
  args: { grantId: v.id("mcpGrants"), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    if (await ctx.db.get(args.grantId)) {
      await ctx.db.patch(args.grantId, { lastUsedAt: Date.now() });
    }
  },
});

// The admin's connected apps

/** The apps an admin connected, newest first. */
export const connections = query({
  args: { email: v.string(), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const admin = await activeAdmin(ctx, args.email);
    if (!admin) {
      return [];
    }
    const grants = await ctx.db
      .query("mcpGrants")
      .withIndex("by_admin", (q) => q.eq("adminId", admin._id))
      .order("desc")
      .collect();
    return grants.map((grant) => ({
      _creationTime: grant._creationTime,
      _id: grant._id,
      lastUsedAt: grant.lastUsedAt,
      name: grant.clientName,
      site: grant.clientSite,
      write: grant.write,
    }));
  },
});

/** Disconnects one of the admin's apps: its tokens stop working at once. */
export const disconnect = mutation({
  args: { email: v.string(), grantId: v.string(), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const admin = await activeAdmin(ctx, args.email);
    const grantId = ctx.db.normalizeId("mcpGrants", args.grantId);
    const grant = grantId && (await ctx.db.get(grantId));
    if (admin && grant?.adminId === admin._id) {
      await dropGrant(ctx, grant._id);
    }
  },
});

// Housekeeping

/**
 * Drops what's no longer any good: old requests and tokens, grants left
 * without tokens, and registered apps nobody ever connected. Runs hourly, and
 * again while there's more.
 */
export const cleanup = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const requests = await ctx.db
      .query("oauthRequests")
      .withIndex("by_expires", (q) => q.lt("expiresAt", now))
      .take(BATCH);
    const tokens = await ctx.db
      .query("mcpTokens")
      .withIndex("by_expires", (q) => q.lt("expiresAt", now))
      .take(BATCH);
    for (const row of [...requests, ...tokens]) {
      await ctx.db.delete(row._id);
    }
    for (const grantId of new Set(tokens.map((token) => token.grantId))) {
      const left = await ctx.db
        .query("mcpTokens")
        .withIndex("by_grant", (q) => q.eq("grantId", grantId))
        .first();
      if (!left) {
        await dropGrant(ctx, grantId);
      }
    }
    // Apps that were connected once stay registered, so they can come back.
    const clients = await ctx.db
      .query("oauthClients")
      .withIndex("by_connected", (q) =>
        q
          // oxlint-disable-next-line no-useless-undefined -- an index matches a missing field by `undefined`.
          .eq("connectedAt", undefined)
          .lt("_creationTime", now - UNUSED_CLIENT_MS)
      )
      .take(BATCH);
    for (const old of clients) {
      await ctx.db.delete(old._id);
    }
    if ([requests, tokens, clients].some((rows) => rows.length === BATCH)) {
      await ctx.scheduler.runAfter(0, internal.oauth.cleanup, {});
    }
  },
});
