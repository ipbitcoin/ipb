export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const table = resolveTable(event, { writable: true });
  const id = getRouterParam(event, "id");
  const config = useRuntimeConfig();
  const convex = convexClient();

  await convex.mutation(tableApi(table).adminRemove, {
    id,
    serviceKey: config.SERVICE_KEY,
  });
  return { ok: true };
});
