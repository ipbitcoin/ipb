import type { QueryCtx } from "./_generated/server";

/** Membership layers: 1 = participant (€21/year), 2 = ambassador (€21/month). */
export type MemberLayer = 1 | 2;

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

/**
 * Layer of the active member registered with this email (case-insensitive),
 * if any. The payment plan maps 1:1 to the layer: yearly = 1, monthly = 2.
 * The members table is small, so a scan is fine and avoids depending on how
 * each email was capitalised at registration (or in the Strapi import).
 */
export async function activeLayerForEmail(
  ctx: QueryCtx,
  email: string
): Promise<MemberLayer | undefined> {
  const wanted = email.trim().toLowerCase();
  const members = await ctx.db.query("members").collect();
  const member = members.find(
    (m) =>
      m.paymentStatus === "active" && m.email.trim().toLowerCase() === wanted
  );
  if (!member) {
    return undefined;
  }
  return member.paymentPlan === "yearly" ? 1 : 2;
}
