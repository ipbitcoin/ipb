import { v } from "convex/values";

import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { internalQuery, mutation, query } from "./_generated/server";
import { canSendEmail, emailFrom, resend } from "./email";
import { assertServiceKey, localeArg } from "./lib";
import type { Locale } from "./lib";
import { findActiveMemberByEmail } from "./pricing";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONFIRM_TOKEN_TTL_MS = 48 * 60 * 60 * 1000;
const RESEND_CONFIRM_AFTER_MS = 60 * 1000;

const normalizeEmail = (email: string) => email.trim().toLowerCase();

/** Legacy rows (no status) were imported from Strapi and count as confirmed. */
const isConfirmed = (row: Doc<"newsletters">) =>
  !row.status || row.status === "confirmed";

async function rowByEmail(ctx: QueryCtx, email: string) {
  return await ctx.db
    .query("newsletters")
    .withIndex("by_email", (q) => q.eq("email", email))
    .unique();
}

/**
 * Newsletter recipients are: confirmed subscribers + every active member,
 * minus anyone who unsubscribed (an unsubscribe always wins, even for members).
 */
async function isDeliverable(ctx: QueryCtx, email: string) {
  const row = await rowByEmail(ctx, normalizeEmail(email));
  if (row?.status === "unsubscribed") {
    return false;
  }
  if (row && isConfirmed(row)) {
    return true;
  }
  return !!(await findActiveMemberByEmail(ctx, email));
}

function confirmationEmail(link: string, locale: Locale) {
  const button = `<p><a href="${link}" style="display:inline-block;background:#000;color:#fff;padding:12px 20px;text-decoration:none;font-weight:600">`;
  return locale === "en"
    ? {
        html: `<p>To receive the Portuguese Bitcoin Institute newsletter, please confirm your email:</p>${button}Confirm subscription</a></p><p>This link is valid for 48 hours. If you didn't request this, ignore this email.</p>`,
        subject: "Confirm your IPB newsletter subscription",
      }
    : {
        html: `<p>Para receber a newsletter do Instituto Português de Bitcoin, confirme o seu email:</p>${button}Confirmar subscrição</a></p><p>O link é válido durante 48 horas. Se não pediu esta subscrição, ignore este email.</p>`,
        subject: "Confirme a sua subscrição da newsletter IPB",
      };
}

/**
 * Start (or restart) a public sign-up and email the confirmation link. Nothing
 * is delivered until the link is used. Returns nothing: already-confirmed
 * addresses, throttled repeats and new sign-ups all look the same, so the
 * endpoint never reveals who is subscribed. The www route builds the link
 * (it owns the token) and passes only the token's hash for storage.
 */
export const requestSubscription = mutation({
  args: {
    confirmUrl: v.string(),
    email: v.string(),
    locale: localeArg,
    serviceKey: v.string(),
    tokenHash: v.string(),
  },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const email = normalizeEmail(args.email);
    if (!EMAIL_REGEX.test(email)) {
      throw new Error("Invalid email address");
    }

    const row = await rowByEmail(ctx, email);
    const now = Date.now();

    if (row && isConfirmed(row)) {
      return;
    }
    if (
      row?.status === "pending" &&
      row.lastConfirmSentAt &&
      now - row.lastConfirmSentAt < RESEND_CONFIRM_AFTER_MS
    ) {
      return;
    }

    const fields = {
      confirmTokenExpiresAt: now + CONFIRM_TOKEN_TTL_MS,
      confirmTokenHash: args.tokenHash,
      lastConfirmSentAt: now,
      locale: args.locale,
      status: "pending" as const,
      unsubscribedAt: undefined,
    };
    if (row) {
      await ctx.db.patch(row._id, fields);
    } else {
      await ctx.db.insert("newsletters", { email, ...fields });
    }

    if (!canSendEmail()) {
      // Local dev without an email provider: the www route returns the link.
      console.warn("[newsletters] RESEND_API_KEY not set — email not sent");
      return;
    }
    await resend.sendEmail(ctx, {
      from: emailFrom(),
      to: email,
      ...confirmationEmail(args.confirmUrl, args.locale),
    });
  },
});

/** Confirm a sign-up from the emailed link. */
export const confirm = mutation({
  args: { serviceKey: v.string(), tokenHash: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const row = await ctx.db
      .query("newsletters")
      .withIndex("by_confirm_token", (q) =>
        q.eq("confirmTokenHash", args.tokenHash)
      )
      .unique();
    if (!row || (row.confirmTokenExpiresAt ?? 0) < Date.now()) {
      return { ok: false };
    }
    await ctx.db.patch(row._id, {
      confirmedAt: Date.now(),
      confirmTokenExpiresAt: undefined,
      confirmTokenHash: undefined,
      status: "confirmed",
      unsubscribedAt: undefined,
    });
    await ctx.scheduler.runAfter(0, internal.newsletterSync.syncContact, {
      email: row.email,
    });
    return { ok: true };
  },
});

/** Unsubscribe (from the Resend webhook). Creates the row for members too. */
export const markUnsubscribed = mutation({
  args: { email: v.string(), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const email = normalizeEmail(args.email);
    const row = await rowByEmail(ctx, email);
    const fields = {
      confirmTokenExpiresAt: undefined,
      confirmTokenHash: undefined,
      status: "unsubscribed" as const,
      unsubscribedAt: Date.now(),
    };
    if (row) {
      await ctx.db.patch(row._id, fields);
    } else {
      await ctx.db.insert("newsletters", { email, ...fields });
    }
  },
});

/** Should this email currently receive the newsletter? (drives the Resend sync) */
export const deliveryState = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => ({
    subscribed: await isDeliverable(ctx, args.email),
  }),
});

/** Every deliverable email, for the one-off bulk sync script. */
export const allDeliverable = query({
  args: { serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const emails = new Set<string>();
    for (const row of await ctx.db.query("newsletters").collect()) {
      if (isConfirmed(row)) {
        emails.add(normalizeEmail(row.email));
      }
    }
    for (const member of await ctx.db.query("members").collect()) {
      if (member.paymentStatus === "active") {
        emails.add(normalizeEmail(member.email));
      }
    }
    const result: string[] = [];
    for (const email of emails) {
      if ((await rowByEmail(ctx, email))?.status !== "unsubscribed") {
        result.push(email);
      }
    }
    return result;
  },
});

// ── Admin (read-only) ──────────────────────────────────────────────────────

export const adminList = query({
  args: { serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    return await ctx.db.query("newsletters").order("desc").collect();
  },
});
