import { ConvexHttpClient } from "convex/browser";

/** Convex client for Nitro server routes. */
export function convexClient() {
  const config = useRuntimeConfig();
  return new ConvexHttpClient(String(config.public.CONVEX_URL));
}
