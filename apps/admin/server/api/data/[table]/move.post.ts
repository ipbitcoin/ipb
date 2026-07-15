export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const table = resolveTable(event, { writable: true });
  if (!kanbanTables.has(table)) {
    throw createError({ message: "Unknown collection", statusCode: 404 });
  }

  const config = useRuntimeConfig();
  const { id, order, status } = await readBody(event);
  if (!id || typeof order !== "number" || !status) {
    throw createError({
      message: "id, status and order required",
      statusCode: 400,
    });
  }

  const convex = convexClient();
  try {
    await convex.mutation(tableApi(table).adminMove, {
      id,
      order,
      serviceKey: config.SERVICE_KEY,
      status,
    });
  } catch (error) {
    throw createError({
      message: error instanceof Error ? error.message : "Move failed",
      statusCode: 400,
    });
  }
  return { ok: true };
});
