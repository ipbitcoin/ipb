import { api } from "@ipb/backend/api";

/**
 * First login of a dashboard-created (invite-only) account:
 * sets the password once, then opens a session.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const { email, password } = await readBody(event);

  if (!email || !password) {
    throw createError({
      message: "Email and password required",
      statusCode: 400,
    });
  }
  if (String(password).length < 10) {
    throw createError({
      message: "Password must be at least 10 characters",
      statusCode: 400,
    });
  }

  const convex = convexClient();
  const passwordHash = await hashPassword(password);

  try {
    await convex.mutation(api.adminUsers.claimAccount, {
      email,
      passwordHash,
      serviceKey: config.SERVICE_KEY,
    });
  } catch {
    throw createError({
      message: "No claimable account for this email",
      statusCode: 401,
    });
  }

  await setUserSession(event, { user: { email: String(email).toLowerCase() } });
  return { ok: true };
});
