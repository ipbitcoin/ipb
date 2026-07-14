export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const table = resolveTable(event, { writable: true });
  const id = getRouterParam(event, "id");
  const config = useRuntimeConfig();
  const convex = convexClient();

  const record = await convex.query(tableApi(table).adminGet, {
    id,
    serviceKey: config.SERVICE_KEY,
  });
  if (!record) {
    throw createError({ message: "Not found", statusCode: 404 });
  }
  return record;
});
