import { api } from "@ipb/backend/api";

/** Step 3 of the media flow: sync metadata after the browser PUT. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const { key } = await readBody(event);
  if (!key) {
    throw createError({ message: "Missing key", statusCode: 400 });
  }
  const config = useRuntimeConfig();
  const convex = convexClient();

  await convex.action(api.r2.syncMetadata, {
    key,
    serviceKey: config.SERVICE_KEY,
  });
  return { ok: true };
});
