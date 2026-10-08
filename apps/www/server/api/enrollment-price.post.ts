import { api } from "@ipb/backend/api";

/** Course price for an email: members get their layer's discount. */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody<{ email?: string } | undefined>(event);
  const email = body?.email?.trim();

  if (!(email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    throw createError({ message: "Invalid email address", statusCode: 400 });
  }

  const convex = convexClient();
  return await convex.query(api.members.coursePriceByEmail, {
    email,
    serviceKey: config.SERVICE_KEY,
  });
});
