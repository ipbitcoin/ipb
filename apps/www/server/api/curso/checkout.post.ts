import { api } from "@ipb/backend/api";
import { findCourse } from "@ipb/backend/courseCatalog";

/**
 * Starts the purchase of one online course: the server decides the price
 * (member discount only with a valid email-verification token), then opens a
 * Stripe Checkout page that accepts cards only.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody<
    | {
        course?: string;
        email?: string;
        locale?: string;
        memberToken?: string;
      }
    | undefined
  >(event);

  const course = findCourse(body?.course ?? "");
  const email = body?.email?.trim().toLowerCase();
  const locale = body?.locale === "en" ? "en" : "pt";
  if (!(course && email && EMAIL_REGEX.test(email))) {
    throw createError({ message: "Invalid course or email", statusCode: 400 });
  }

  const convex = convexClient();
  const serviceKey = config.SERVICE_KEY;

  let order: { orderId: string; priceCents: number };
  try {
    order = await convex.mutation(api.courses.createOrder, {
      courseSlug: course.slug,
      email,
      locale,
      memberTokenHash: body?.memberToken
        ? hashToken(body.memberToken)
        : undefined,
      serviceKey,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("already owned")) {
      throw createError({ message: "Already owned", statusCode: 409 });
    }
    throw createError({
      message: "Could not start the order",
      statusCode: 500,
    });
  }

  const origin = siteOrigin(event);
  const purchaseUrl = `${origin}${coursePath(locale, "purchase")}`;

  // ── Dev mode: no Stripe key → the order is paid at once ──
  if (!config.STRIPE_SECRET_KEY) {
    console.warn(
      "[curso/checkout] STRIPE_SECRET_KEY not set — simulating payment"
    );
    await convex.mutation(api.courses.markPaid, {
      orderId: order.orderId,
      serviceKey,
    });
    return {
      url: `${purchaseUrl}?status=success&session_id=dev_${order.orderId}`,
    };
  }

  const title = `${course.number}. ${course.title[locale]}`;
  const params = new URLSearchParams();
  params.append("mode", "payment");
  params.append("payment_method_types[]", "card");
  params.append("locale", locale);
  params.append("customer_email", email);
  params.append("line_items[0][quantity]", "1");
  params.append("line_items[0][price_data][currency]", "eur");
  params.append(
    "line_items[0][price_data][unit_amount]",
    String(order.priceCents)
  );
  params.append(
    "line_items[0][price_data][product_data][name]",
    locale === "en" ? `Online course ${title}` : `Curso online ${title}`
  );
  params.append(
    "line_items[0][price_data][product_data][description]",
    locale === "en"
      ? "Portuguese Bitcoin Institute — self-paced course with diploma"
      : "Instituto Português de Bitcoin — curso de autoestudo com diploma"
  );
  params.append("metadata[type]", "course");
  params.append("metadata[orderId]", order.orderId);
  params.append("payment_intent_data[metadata][type]", "course");
  params.append("payment_intent_data[metadata][orderId]", order.orderId);
  params.append("payment_intent_data[receipt_email]", email);
  params.append(
    "success_url",
    `${purchaseUrl}?status=success&session_id={CHECKOUT_SESSION_ID}`
  );
  params.append(
    "cancel_url",
    `${origin}${coursePath(locale, "home")}/${course.slug}?status=cancel`
  );

  const session = await $fetch<{ id: string; url: string }>(
    "https://api.stripe.com/v1/checkout/sessions",
    {
      body: params.toString(),
      headers: {
        Authorization: `Bearer ${config.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    }
  ).catch((error: unknown) => {
    console.error("[curso/checkout] Stripe error:", error);
    throw createError({ message: "Payment provider error", statusCode: 502 });
  });

  await convex
    .mutation(api.courses.setStripeSession, {
      orderId: order.orderId,
      serviceKey,
      stripeSessionId: session.id,
    })
    .catch((error: unknown) => {
      console.error("[curso/checkout] Failed to save Stripe session:", error);
    });

  return { url: session.url };
});
