import { Resend } from "@convex-dev/resend";

import { components } from "./_generated/api";
import { internalMutation } from "./_generated/server";

// Convex runtime exposes env vars via process.env inside its V8 isolate.
declare const process: { env: Record<string, string | undefined> };

/**
 * Transactional email through the Resend component: emails are queued inside
 * the calling mutation and sent (batched, with retries) in the background.
 * Convex env: RESEND_API_KEY (required to send), EMAIL_FROM (optional).
 */
export const resend: Resend = new Resend(components.resend, {
  testMode: false,
});

export const canSendEmail = () => Boolean(process.env.RESEND_API_KEY);

export const emailFrom = () =>
  process.env.EMAIL_FROM || "IPB <no-reply@institutobitcoin.pt>";

const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * Hourly (see crons.ts). Emails only carry one-time codes, so none are kept
 * for long. Without a Resend webhook sent emails never "finalize", so they are
 * removed by age.
 */
export const cleanup = internalMutation({
  args: {},
  handler: async (ctx) => {
    await ctx.scheduler.runAfter(
      0,
      components.resend.lib.cleanupAbandonedEmails,
      { olderThan: ONE_HOUR_MS }
    );
  },
});
