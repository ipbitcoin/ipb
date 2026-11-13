import { api } from "@ipb/backend/api";

/** Public: confirms a diploma code and returns what is printed on it. */
export default defineEventHandler(async (event) => {
  const code = (getRouterParam(event, "codigo") ?? "").toUpperCase();
  if (!/^IPB-C[1-9]-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) {
    return { valid: false };
  }
  const found = await convexClient().query(api.courses.verifyDiploma, {
    code,
    serviceKey: useRuntimeConfig().SERVICE_KEY,
  });
  return found ? { ...found, code, valid: true } : { valid: false };
});
