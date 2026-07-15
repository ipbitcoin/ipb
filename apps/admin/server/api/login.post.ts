import { api } from "@ipb/backend/api";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const { email, password } = await readBody(event);

  if (!email || !password) {
    throw createError({
      message: "Email and password required",
      statusCode: 400,
    });
  }

  const convex = convexClient();
  const user = await convex.query(api.adminUsers.getByEmail, {
    email,
    serviceKey: config.SERVICE_KEY,
  });

  if (!user || !user.active) {
    throw createError({ message: "Invalid credentials", statusCode: 401 });
  }

  // Dashboard-created invite not yet claimed — the client shows the
  // set-password flow and calls /api/claim-account.
  if (!user.passwordHash) {
    throw createError({ message: "needs-setup", statusCode: 409 });
  }

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) {
    throw createError({ message: "Invalid credentials", statusCode: 401 });
  }

  await setUserSession(event, {
    user: {
      avatarKey: user.avatarKey,
      email: user.email,
      username: user.username,
    },
  });
  return { ok: true };
});
