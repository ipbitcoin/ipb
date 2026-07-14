import { api } from "@ipb/backend/api";

/** Delete a replaced R2 object. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const { key } = await readBody(event);
  if (!key) {
    throw createError({ message: "Missing key", statusCode: 400 });
  }
  const config = useRuntimeConfig();
  const convex = convexClient();

  await convex.mutation(api.r2.deleteObject, {
    key,
    serviceKey: config.SERVICE_KEY,
  });
  return { ok: true };
});
