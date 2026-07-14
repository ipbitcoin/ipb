import { api } from "@ipb/backend/api";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const email = typeof body?.email === "string" ? body.email.trim() : "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ message: "Invalid email address", statusCode: 400 });
  }

  const convex = convexClient();
  // Idempotent by email — repeated subscriptions are a no-op
  await convex.mutation(api.newsletters.subscribe, { email });

  return { subscribed: true };
});
