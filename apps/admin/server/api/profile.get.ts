import { api } from "@ipb/backend/api";

/** Current admin's profile, fresh from the database (session may be stale). */
export default defineEventHandler(async (event) => {
  const sessionUser = await requireAdmin(event);
  const config = useRuntimeConfig();
  const convex = convexClient();
  const user = await convex.query(api.adminUsers.getByEmail, {
    email: sessionUser.email,
    serviceKey: config.SERVICE_KEY,
  });
  if (!user || !user.active) {
    throw createError({ message: "Unauthorized", statusCode: 401 });
  }
  return {
    avatarKey: user.avatarKey ?? null,
    email: user.email,
    username: user.username ?? null,
  };
});
