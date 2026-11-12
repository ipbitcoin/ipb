import { api } from "@ipb/backend/api";
import { ConvexError } from "convex/values";

/** The admin lets the app in: it gets a one-time code back at its redirect. */
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event);
  const { request, write } = await readBody<{
    request?: unknown;
    write?: unknown;
  }>(event);
  if (typeof request !== "string" || typeof write !== "boolean") {
    throw createError({
      message: "request and write required",
      statusCode: 400,
    });
  }
  const code = newSecret("ipbac");
  try {
    const { redirectUri, state } = await convexClient().mutation(
      api.oauth.approve,
      {
        codeHash: hashSecret(code),
        email: admin.email,
        requestId: request,
        serviceKey: useRuntimeConfig(event).SERVICE_KEY,
        write,
      }
    );
    return {
      redirect: redirectWith(redirectUri, {
        code,
        iss: oauthOrigin(event),
        state,
      }),
    };
  } catch (error: unknown) {
    throw createError({
      message:
        error instanceof ConvexError && typeof error.data === "string"
          ? error.data
          : "Não foi possível ligar a app.",
      statusCode: 400,
    });
  }
});
