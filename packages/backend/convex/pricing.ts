import type { Doc } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";

/** Membership layers: 1 = participant (€21/year), 2 = ambassador (€21/month). */
export type MemberLayer = 1 | 2;
export type PaymentPlan = "yearly" | "monthly";

export const COURSE_BASE_PRICE_EUR = 200;

/**
 * Course price per membership layer.
 * Layer 2 gets 50% off. Layer 1's "member price" has no amount defined yet,
 * so it stays at full price until the real value is set here.
 */
const COURSE_PRICE_BY_LAYER: Record<MemberLayer, number> = {
  1: COURSE_BASE_PRICE_EUR,
  2: COURSE_BASE_PRICE_EUR / 2,
};

export function coursePriceEur(layer?: MemberLayer): number {
  return layer ? COURSE_PRICE_BY_LAYER[layer] : COURSE_BASE_PRICE_EUR;
}

/** New memberships: yearly plan = Layer 1, monthly plan = Layer 2. */
export function planLayer(plan: PaymentPlan): MemberLayer {
  return plan === "yearly" ? 1 : 2;
}

/**
 * Layer of a member. Every sign-up since the layers launched stores `layer`.
 * Rows without it are older members (Strapi imports and sign-ups on the old
 * €250/year plans): all Layer 2, whatever they pay.
 */
export function layerOfMember(member: Doc<"members">): MemberLayer {
  return member.layer ?? 2;
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

/**
 * Member with this email (case-insensitive), any status. The members table is
 * small, so a scan is fine and avoids depending on how each email was
 * capitalised at registration (or in the Strapi import).
 */
export async function findMemberByEmail(
  ctx: QueryCtx,
  email: string
): Promise<Doc<"members"> | undefined> {
  const wanted = normalizeEmail(email);
  const members = await ctx.db.query("members").collect();
  const matches = members.filter((m) => normalizeEmail(m.email) === wanted);
  // Older rows can repeat an email with different case: prefer the active one.
  return matches.find((m) => m.paymentStatus === "active") ?? matches[0];
}

export async function findActiveMemberByEmail(
  ctx: QueryCtx,
  email: string
): Promise<Doc<"members"> | undefined> {
  const member = await findMemberByEmail(ctx, email);
  return member?.paymentStatus === "active" ? member : undefined;
}

/**
 * Layer to price a course at: only when `tokenHash` is a valid, unexpired
 * email-verification token for exactly this email AND that email belongs to an
 * active member. Anything else pays the base price.
 */
export async function verifiedMemberLayer(
  ctx: QueryCtx,
  email: string,
  tokenHash: string | undefined
): Promise<MemberLayer | undefined> {
  if (!tokenHash) {
    return undefined;
  }
  const verification = await ctx.db
    .query("memberVerifications")
    .withIndex("by_token_hash", (q) => q.eq("tokenHash", tokenHash))
    .unique();
  if (
    !verification ||
    verification.email !== normalizeEmail(email) ||
    (verification.tokenExpiresAt ?? 0) < Date.now()
  ) {
    return undefined;
  }
  const member = await findActiveMemberByEmail(ctx, email);
  return member ? layerOfMember(member) : undefined;
}
