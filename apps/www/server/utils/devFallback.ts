/**
 * Payment routes simulate a successful payment when their provider key is not
 * set, so the app works locally without Stripe/OpenNode. That must never
 * happen in production: a missing key there would show donors a fake "thank
 * you" (or activate members who never paid). Call this where the key is
 * missing — in dev it lets the simulation proceed, in production it fails
 * loudly instead.
 */
export function assertDevFallback(missingKey: string): void {
  if (import.meta.dev) {
    return;
  }
  console.error(`[payments] ${missingKey} is not set in production`);
  throw createError({
    message: "Payments are temporarily unavailable",
    statusCode: 503,
  });
}
