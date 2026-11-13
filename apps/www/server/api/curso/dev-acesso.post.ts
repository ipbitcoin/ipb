import { randomBytes } from "node:crypto";

import { api } from "@ipb/backend/api";
import { ONLINE_COURSES } from "@ipb/backend/courseCatalog";

/**
 * DEVELOPMENT ONLY. Gives an email access to every online course without
 * paying and signs it in. Answers 404 anywhere but `nuxt dev`, so it does not
 * exist in a production build.
 */
export default defineEventHandler(async (event) => {
  if (!import.meta.dev) {
    throw createError({ message: "Not found", statusCode: 404 });
  }
  const config = useRuntimeConfig();
  const convex = convexClient();
  const serviceKey = config.SERVICE_KEY;
  const body = await readBody<{ email?: string } | undefined>(event);
  const email = (body?.email?.trim() || "dev@example.com").toLowerCase();

  for (const course of ONLINE_COURSES) {
    try {
      const order = await convex.mutation(api.courses.createOrder, {
        courseSlug: course.slug,
        email,
        locale: "pt",
        serviceKey,
      });
      await convex.mutation(api.courses.markPaid, {
        orderId: order.orderId,
        serviceKey,
      });
    } catch (error: unknown) {
      // Already owned: nothing to do for this course.
      if (
        !(error instanceof Error && error.message.includes("already owned"))
      ) {
        throw error;
      }
    }
  }

  const token = randomBytes(32).toString("hex");
  await convex.mutation(api.courses.startSessionAfterPurchase, {
    email,
    serviceKey,
    tokenHash: hashToken(token),
  });
  setSessionCookie(event, token);
  return { email, ok: true };
});
