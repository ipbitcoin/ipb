import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { assertServiceKey } from "./lib";
import {
  coursePriceEur,
  findActiveMemberByEmail,
  verifiedMemberLayer,
} from "./pricing";

const CODE_TTL_MS = 10 * 60 * 1000;
const TOKEN_TTL_MS = 30 * 60 * 1000;
const SEND_WINDOW_MS = 15 * 60 * 1000;
const MAX_SENDS_PER_WINDOW = 3;
const MAX_ATTEMPTS = 5;

const normalizeEmail = (email: string) => email.trim().toLowerCase();

/**
 * Store a one-time code for an active member's email. Hashes only: the www
 * server route generates the code, emails it, and keeps it out of the DB.
 * `send` tells the route whether to email the code. It is false for non-members
 * and when rate-limited, and the route answers the same either way so the
 * endpoint never reveals who is a member.
 */
export const request = mutation({
  args: { codeHash: v.string(), email: v.string(), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const member = await findActiveMemberByEmail(ctx, args.email);
    if (!member) {
      return { send: false };
    }

    const email = normalizeEmail(args.email);
    const now = Date.now();
    const existing = await ctx.db
      .query("memberVerifications")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    const recent = (existing?.sentAt ?? []).filter(
      (t) => now - t < SEND_WINDOW_MS
    );
    if (recent.length >= MAX_SENDS_PER_WINDOW) {
      return { send: false };
    }

    const fields = {
      attempts: 0,
      codeExpiresAt: now + CODE_TTL_MS,
      codeHash: args.codeHash,
      sentAt: [...recent, now],
    };
    if (existing) {
      await ctx.db.patch(existing._id, fields);
    } else {
      await ctx.db.insert("memberVerifications", { email, ...fields });
    }
    return { send: true };
  },
});

/** Check a code; on success store the hash of a fresh session token. */
export const confirm = mutation({
  args: {
    codeHash: v.string(),
    email: v.string(),
    serviceKey: v.string(),
    tokenHash: v.string(),
  },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const email = normalizeEmail(args.email);
    const row = await ctx.db
      .query("memberVerifications")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    const now = Date.now();
    if (
      !row ||
      !row.codeHash ||
      row.codeExpiresAt < now ||
      row.attempts >= MAX_ATTEMPTS
    ) {
      return { ok: false };
    }
    if (row.codeHash !== args.codeHash) {
      await ctx.db.patch(row._id, { attempts: row.attempts + 1 });
      return { ok: false };
    }

    // Single use: burn the code, issue the token.
    await ctx.db.patch(row._id, {
      attempts: 0,
      codeExpiresAt: 0,
      codeHash: "",
      tokenExpiresAt: now + TOKEN_TTL_MS,
      tokenHash: args.tokenHash,
    });
    return { ok: true };
  },
});

/** Course price for an email, discounted only with a valid verification token. */
export const priceForToken = query({
  args: {
    email: v.string(),
    serviceKey: v.string(),
    tokenHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const memberLayer = await verifiedMemberLayer(
      ctx,
      args.email,
      args.tokenHash
    );
    return { memberLayer, priceEur: coursePriceEur(memberLayer) };
  },
});
