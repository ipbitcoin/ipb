import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { canSendEmail, emailFrom, resend } from "./email";
import { assertServiceKey, localeArg } from "./lib";
import type { Locale } from "./lib";
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

function codeEmail(code: string, locale: Locale) {
  const big = `<p style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p>`;
  return locale === "en"
    ? {
        html: `<p>Your IPB verification code is:</p>${big}<p>Valid for 10 minutes. If you didn't request it, ignore this email.</p>`,
        subject: "IPB verification code",
      }
    : {
        html: `<p>O seu código de verificação IPB é:</p>${big}<p>Válido durante 10 minutos. Se não pediu este código, ignore este e-mail.</p>`,
        subject: "Código de verificação IPB",
      };
}

/**
 * Email a one-time code to an active member. The www server route generates
 * the code; only its hash is stored here, and the email is queued in this
 * same transaction (Resend component). Returns nothing: non-members and
 * rate-limited requests look the same as a sent code, so the endpoint never
 * reveals who is a member.
 */
export const request = mutation({
  args: {
    code: v.string(),
    codeHash: v.string(),
    email: v.string(),
    locale: localeArg,
    serviceKey: v.string(),
  },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const member = await findActiveMemberByEmail(ctx, args.email);
    if (!member) {
      return;
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
      return;
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

    if (!canSendEmail()) {
      // Local dev without an email provider: the www route returns the code.
      console.warn(
        "[memberVerification] RESEND_API_KEY not set — code not emailed"
      );
      return;
    }
    await resend.sendEmail(ctx, {
      from: emailFrom(),
      to: member.email.trim(),
      ...codeEmail(args.code, args.locale),
    });
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
