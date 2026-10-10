import { v } from "convex/values";

import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

// Convex runtime exposes env vars via process.env inside its V8 isolate.
declare const process: { env: Record<string, string | undefined> };

const RESEND_API = "https://api.resend.com/contacts";

/**
 * Make the Resend contact match who should receive the newsletter (confirmed
 * subscribers + active members, minus unsubscribes). Convex stays the source
 * of truth; mutations schedule this after anything that changes it.
 * Convex env: RESEND_API_KEY (skipped when unset), RESEND_SEGMENT_ID (optional).
 * Throws on failure so the scheduler's error log shows it; the next change
 * (or scripts/newsletter/sync-all.ts) repairs it.
 */
export const syncContact = internalAction({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("[newsletterSync] RESEND_API_KEY not set — not synced");
      return;
    }

    const email = args.email.trim().toLowerCase();
    const { subscribed } = await ctx.runQuery(
      internal.newsletters.deliveryState,
      { email }
    );
    const headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    const patched = await fetch(`${RESEND_API}/${encodeURIComponent(email)}`, {
      body: JSON.stringify({ unsubscribed: !subscribed }),
      headers,
      method: "PATCH",
    });
    if (patched.ok) {
      return;
    }
    if (patched.status !== 404) {
      throw new Error(
        `Resend contact update failed: ${patched.status} ${await patched.text()}`
      );
    }

    // Not in Resend yet: only worth creating if they should get emails.
    if (!subscribed) {
      return;
    }
    const segmentId = process.env.RESEND_SEGMENT_ID;
    const created = await fetch(RESEND_API, {
      body: JSON.stringify({
        email,
        unsubscribed: false,
        ...(segmentId && { segments: [{ id: segmentId }] }),
      }),
      headers,
      method: "POST",
    });
    if (!created.ok) {
      throw new Error(
        `Resend contact create failed: ${created.status} ${await created.text()}`
      );
    }
  },
});
