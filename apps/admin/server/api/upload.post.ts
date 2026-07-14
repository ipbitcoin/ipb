import { api } from "@ipb/backend/api";

/** Step 1 of the media flow: get a signed R2 upload URL + key. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const config = useRuntimeConfig();
  const convex = convexClient();

  const { url, key } = await convex.mutation(api.r2.getUploadUrl, {
    serviceKey: config.SERVICE_KEY,
  });
  return { key, url };
});
