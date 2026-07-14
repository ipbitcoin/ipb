export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const table = resolveTable(event, { writable: true });
  const body = await readBody(event);
  const config = useRuntimeConfig();
  const convex = convexClient();

  try {
    const id = await convex.mutation(tableApi(table).adminCreate, {
      serviceKey: config.SERVICE_KEY,
      ...body,
    });
    return { id };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Create failed";
    throw createError({ message, statusCode: 400 });
  }
});
