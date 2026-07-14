export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const table = resolveTable(event, { writable: true });
  const id = getRouterParam(event, "id");
  const body = await readBody(event);
  const config = useRuntimeConfig();
  const convex = convexClient();

  try {
    await convex.mutation(tableApi(table).adminUpdate, {
      id,
      serviceKey: config.SERVICE_KEY,
      ...body,
    });
    return { ok: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Update failed";
    throw createError({ message, statusCode: 400 });
  }
});
