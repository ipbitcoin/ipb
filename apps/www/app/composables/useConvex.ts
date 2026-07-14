import { ConvexHttpClient } from "convex/browser";

/**
 * Isomorphic Convex client (plain HTTP) — works during SSR and on the client.
 * Public reads only; server routes construct their own client with SERVICE_KEY.
 */
export default function useConvex() {
  const config = useRuntimeConfig();
  return new ConvexHttpClient(String(config.public.CONVEX_URL));
}
