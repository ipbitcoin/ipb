/**
 * One-off: push everyone who should receive the newsletter (confirmed
 * subscribers incl. legacy Strapi ones + active members, minus unsubscribes)
 * into Resend as contacts. Safe to re-run: existing contacts are left alone.
 * After this, Convex keeps Resend in sync on every change.
 *
 * Usage: CONVEX_URL=... SERVICE_KEY=... RESEND_API_KEY=... \
 *        [RESEND_SEGMENT_ID=...] bun scripts/newsletter/sync-all.ts [--dry-run]
 */
import { ConvexHttpClient } from "convex/browser";

import { api } from "../../convex/_generated/api";
import { env } from "../migrate/shared";

const dryRun = process.argv.includes("--dry-run");
const client = new ConvexHttpClient(env("CONVEX_URL"));
const serviceKey = env("SERVICE_KEY");
const resendKey = dryRun ? "" : env("RESEND_API_KEY");
const segmentId = process.env.RESEND_SEGMENT_ID;

const emails = await client.query(api.newsletters.allDeliverable, {
  serviceKey,
});
console.log(`${emails.length} recipients to sync${dryRun ? " (dry run)" : ""}`);

let created = 0;
let failed = 0;

for (const email of emails) {
  if (dryRun) {
    continue;
  }
  const res = await fetch("https://api.resend.com/contacts", {
    body: JSON.stringify({
      email,
      unsubscribed: false,
      ...(segmentId && { segments: [{ id: segmentId }] }),
    }),
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  if (res.ok) {
    created += 1;
  } else if (res.status === 409 || res.status === 422) {
    // Already exists: leave its current subscription state alone.
  } else {
    failed += 1;
    console.error(`  ${email}: ${res.status} ${await res.text()}`);
  }
  // Stay under Resend's default rate limit (2 requests/second).
  await Bun.sleep(600);
}

console.log(`done: ${created} created, ${failed} failed`);
