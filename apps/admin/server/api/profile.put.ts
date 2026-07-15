import { api } from "@ipb/backend/api";

const USERNAME_PATTERN = /^[a-z0-9._-]{2,30}$/i;

export default defineEventHandler(async (event) => {
  const sessionUser = await requireAdmin(event);

  const config = useRuntimeConfig();
  const { avatarKey, username } = await readBody(event);
  if (typeof username !== "string" || !USERNAME_PATTERN.test(username.trim())) {
    throw createError({
      message: "Username inválido (2-30 caracteres: letras, números, . _ -)",
      statusCode: 400,
    });
  }
  if (avatarKey !== undefined && typeof avatarKey !== "string") {
    throw createError({ message: "Invalid avatar", statusCode: 400 });
  }

  const convex = convexClient();
  let profile;
  try {
    profile = await convex.mutation(api.adminUsers.updateProfile, {
      avatarKey: avatarKey || undefined,
      email: sessionUser.email,
      serviceKey: config.SERVICE_KEY,
      username,
    });
  } catch (error) {
    throw createError({
      message:
        error instanceof Error && error.message.includes("já em uso")
          ? "Username já em uso"
          : "Não foi possível atualizar o perfil",
      statusCode: 400,
    });
  }

  await replaceUserSession(event, {
    user: {
      avatarKey: profile.avatarKey,
      email: sessionUser.email,
      username: profile.username,
    },
  });
  return { ok: true };
});
