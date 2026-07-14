export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const table = resolveTable(event);
  const config = useRuntimeConfig();
  const convex = convexClient();

  return await convex.query(tableApi(table).adminList, {
    serviceKey: config.SERVICE_KEY,
  });
});
