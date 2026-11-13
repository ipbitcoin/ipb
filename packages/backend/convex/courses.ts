import { v } from "convex/values";

import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import {
  findCourse,
  coursePriceCents,
  COURSE_PRICE_CENTS,
} from "./courseCatalog";
import { canSendEmail, emailFrom, resend } from "./email";
import { assertServiceKey, localeArg } from "./lib";
import type { Locale } from "./lib";
import { verifiedMemberLayer } from "./pricing";

// Convex runtime exposes env vars via process.env inside its V8 isolate.
declare const process: { env: Record<string, string | undefined> };

const CODE_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_MS = 90 * 24 * 60 * 60 * 1000;
const SEND_WINDOW_MS = 15 * 60 * 1000;
const MAX_SENDS_PER_WINDOW = 3;
const MAX_ATTEMPTS = 5;
const MAX_LESSONS = 100;

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const appUrl = () => process.env.APP_URL || "https://institutobitcoin.pt";

async function ordersOf(ctx: QueryCtx, email: string) {
  return await ctx.db
    .query("courseOrders")
    .withIndex("by_email", (q) => q.eq("email", normalizeEmail(email)))
    .collect();
}

async function paidOrder(ctx: QueryCtx, email: string, courseSlug: string) {
  const orders = await ordersOf(ctx, email);
  return orders.find(
    (o) => o.courseSlug === courseSlug && o.paymentStatus === "paid"
  );
}

function enterUrl(locale: Locale) {
  return `${appUrl()}${locale === "en" ? "/en/online-course/sign-in" : "/curso-online/entrar"}`;
}

function purchaseEmail(order: Doc<"courseOrders">) {
  const course = findCourse(order.courseSlug);
  const locale = order.locale;
  const name = course
    ? `${course.number}. ${course.title[locale]}`
    : order.courseSlug;
  const price = (order.priceCents / 100).toFixed(2).replace(".", ",");
  const link = enterUrl(locale);
  return locale === "en"
    ? {
        html: `<p>Thank you for your purchase.</p><p><strong>Online course ${name}</strong> — €${price}</p><p>To start, go to <a href="${link}">${link}</a> and sign in with this email address (${order.email}). We will send you a one-time code; no password is needed.</p><p>Instituto Português de Bitcoin</p>`,
        subject: `Your IPB course: ${name}`,
      }
    : {
        html: `<p>Obrigado pela compra.</p><p><strong>Curso online ${name}</strong> — ${price} €</p><p>Para começar, aceder a <a href="${link}">${link}</a> e entrar com este email (${order.email}). É enviado um código de uso único; não é preciso palavra-passe.</p><p>Instituto Português de Bitcoin</p>`,
        subject: `Curso IPB: ${name}`,
      };
}

function loginEmail(code: string, locale: Locale) {
  const big = `<p style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p>`;
  return locale === "en"
    ? {
        html: `<p>Your IPB course sign-in code is:</p>${big}<p>Valid for 10 minutes. If you didn't request it, ignore this email.</p>`,
        subject: "IPB course sign-in code",
      }
    : {
        html: `<p>O código para entrar nos cursos do IPB é:</p>${big}<p>Válido durante 10 minutos. Se este código não foi pedido, ignorar este email.</p>`,
        subject: "Código de acesso aos cursos IPB",
      };
}

// ── Purchase ───────────────────────────────────────────────────────────────

/**
 * Creates a pending order. The price is decided here: the base price, or a
 * member's discount when `memberTokenHash` is a valid email-verification token
 * for exactly this email (same check as the in-person training).
 */
export const createOrder = mutation({
  args: {
    courseSlug: v.string(),
    email: v.string(),
    locale: localeArg,
    memberTokenHash: v.optional(v.string()),
    serviceKey: v.string(),
  },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const course = findCourse(args.courseSlug);
    const email = normalizeEmail(args.email);
    if (!(course && email.includes("@"))) {
      throw new Error("Invalid course or email");
    }
    if (await paidOrder(ctx, email, course.slug)) {
      throw new Error("already owned");
    }

    const memberLayer = await verifiedMemberLayer(
      ctx,
      email,
      args.memberTokenHash
    );
    const orderId = `CUR-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase()}`;
    const priceCents = coursePriceCents(memberLayer);

    await ctx.db.insert("courseOrders", {
      completedLessons: [],
      courseSlug: course.slug,
      createdAt: Date.now(),
      email,
      listPriceCents: COURSE_PRICE_CENTS,
      locale: args.locale,
      memberLayer,
      orderId,
      paymentStatus: "pending",
      priceCents,
    });
    return { memberLayer, orderId, priceCents };
  },
});

export const setStripeSession = mutation({
  args: {
    orderId: v.string(),
    serviceKey: v.string(),
    stripeSessionId: v.string(),
  },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const order = await ctx.db
      .query("courseOrders")
      .withIndex("by_order_id", (q) => q.eq("orderId", args.orderId))
      .unique();
    if (order) {
      await ctx.db.patch(order._id, { stripeSessionId: args.stripeSessionId });
    }
  },
});

/** Marks an order paid and emails the buyer. Safe to repeat (webhook + return page). */
export const markPaid = mutation({
  args: {
    orderId: v.string(),
    serviceKey: v.string(),
    stripeSessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const order = await ctx.db
      .query("courseOrders")
      .withIndex("by_order_id", (q) => q.eq("orderId", args.orderId))
      .unique();
    if (!order) {
      throw new Error("Order not found");
    }
    if (order.paymentStatus === "paid") {
      return { email: order.email, first: false };
    }

    await ctx.db.patch(order._id, {
      paidAt: Date.now(),
      paymentStatus: "paid",
      stripeSessionId: args.stripeSessionId ?? order.stripeSessionId,
    });

    if (canSendEmail()) {
      await resend.sendEmail(ctx, {
        from: emailFrom(),
        to: order.email,
        ...purchaseEmail(order),
      });
    } else {
      console.warn("[courses] RESEND_API_KEY not set — receipt not emailed");
    }
    return { email: order.email, first: true };
  },
});

export const getOrder = query({
  args: { orderId: v.string(), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const order = await ctx.db
      .query("courseOrders")
      .withIndex("by_order_id", (q) => q.eq("orderId", args.orderId))
      .unique();
    return order
      ? {
          courseSlug: order.courseSlug,
          email: order.email,
          orderId: order.orderId,
          paymentStatus: order.paymentStatus,
        }
      : null;
  },
});

// ── Sign-in by email code ──────────────────────────────────────────────────

/**
 * Emails a one-time code to an address that has bought at least one course.
 * Always looks the same from outside, so it never reveals who is a customer.
 */
export const requestLogin = mutation({
  args: {
    code: v.string(),
    codeHash: v.string(),
    email: v.string(),
    locale: localeArg,
    serviceKey: v.string(),
  },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const email = normalizeEmail(args.email);
    const owns = (await ordersOf(ctx, email)).some(
      (o) => o.paymentStatus === "paid"
    );
    if (!owns) {
      return;
    }

    const now = Date.now();
    const existing = await ctx.db
      .query("courseLogins")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    const recent = (existing?.sentAt ?? []).filter(
      (t) => now - t < SEND_WINDOW_MS
    );
    if (recent.length >= MAX_SENDS_PER_WINDOW) {
      return;
    }

    const fields = {
      attempts: 0,
      codeExpiresAt: now + CODE_TTL_MS,
      codeHash: args.codeHash,
      sentAt: [...recent, now],
    };
    if (existing) {
      await ctx.db.patch(existing._id, fields);
    } else {
      await ctx.db.insert("courseLogins", { email, ...fields });
    }

    if (!canSendEmail()) {
      console.warn("[courses] RESEND_API_KEY not set — code not emailed");
      return;
    }
    await resend.sendEmail(ctx, {
      from: emailFrom(),
      to: email,
      ...loginEmail(args.code, args.locale),
    });
  },
});

async function openSession(ctx: MutationCtx, email: string, tokenHash: string) {
  const now = Date.now();
  // Forget this learner's expired sessions while we are here.
  const old = await ctx.db
    .query("courseSessions")
    .withIndex("by_email", (q) => q.eq("email", email))
    .collect();
  for (const session of old) {
    if (session.expiresAt < now) {
      await ctx.db.delete(session._id);
    }
  }
  await ctx.db.insert("courseSessions", {
    email,
    expiresAt: now + SESSION_TTL_MS,
    tokenHash,
  });
}

/** Checks a code; on success opens a session for the token hash. */
export const confirmLogin = mutation({
  args: {
    codeHash: v.string(),
    email: v.string(),
    serviceKey: v.string(),
    tokenHash: v.string(),
  },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const email = normalizeEmail(args.email);
    const row = await ctx.db
      .query("courseLogins")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    const now = Date.now();
    if (
      !row ||
      !row.codeHash ||
      row.codeExpiresAt < now ||
      row.attempts >= MAX_ATTEMPTS
    ) {
      return { ok: false };
    }
    if (row.codeHash !== args.codeHash) {
      await ctx.db.patch(row._id, { attempts: row.attempts + 1 });
      return { ok: false };
    }
    await ctx.db.patch(row._id, {
      attempts: 0,
      codeExpiresAt: 0,
      codeHash: "",
    });
    await openSession(ctx, email, args.tokenHash);
    return { ok: true };
  },
});

/** Opens a session right after a paid checkout (the buyer just proved the email by paying). */
export const startSessionAfterPurchase = mutation({
  args: {
    email: v.string(),
    serviceKey: v.string(),
    tokenHash: v.string(),
  },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const email = normalizeEmail(args.email);
    const owns = (await ordersOf(ctx, email)).some(
      (o) => o.paymentStatus === "paid"
    );
    if (!owns) {
      return { ok: false };
    }
    await openSession(ctx, email, args.tokenHash);
    return { ok: true };
  },
});

export const endSession = mutation({
  args: { serviceKey: v.string(), tokenHash: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const session = await ctx.db
      .query("courseSessions")
      .withIndex("by_token_hash", (q) => q.eq("tokenHash", args.tokenHash))
      .unique();
    if (session) {
      await ctx.db.delete(session._id);
    }
  },
});

/** The signed-in learner and every course they own, with progress. */
export const account = query({
  args: { serviceKey: v.string(), tokenHash: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const session = await ctx.db
      .query("courseSessions")
      .withIndex("by_token_hash", (q) => q.eq("tokenHash", args.tokenHash))
      .unique();
    if (!session || session.expiresAt < Date.now()) {
      return null;
    }
    const orders = (await ordersOf(ctx, session.email)).filter(
      (o) => o.paymentStatus === "paid"
    );
    return {
      courses: orders.map((o) => ({
        completedAt: o.completedAt,
        completedLessons: o.completedLessons,
        courseSlug: o.courseSlug,
        diplomaCode: o.diplomaCode,
        diplomaIssuedAt: o.diplomaIssuedAt,
        diplomaName: o.diplomaName,
      })),
      email: session.email,
    };
  },
});

// ── Progress and diploma ───────────────────────────────────────────────────

/** `lessonIds` is the course's real lesson list, read by the server from the lesson files. */
export const setProgress = mutation({
  args: {
    courseSlug: v.string(),
    done: v.boolean(),
    email: v.string(),
    lesson: v.string(),
    lessonIds: v.array(v.string()),
    serviceKey: v.string(),
  },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    if (
      args.lessonIds.length > MAX_LESSONS ||
      !args.lessonIds.includes(args.lesson)
    ) {
      throw new Error("Unknown lesson");
    }
    const order = await paidOrder(ctx, args.email, args.courseSlug);
    if (!order) {
      throw new Error("No access");
    }
    const set = new Set(order.completedLessons);
    if (args.done) {
      set.add(args.lesson);
    } else {
      set.delete(args.lesson);
    }
    const completedLessons = args.lessonIds.filter((id) => set.has(id));
    const complete = completedLessons.length === args.lessonIds.length;
    await ctx.db.patch(order._id, {
      completedAt: complete ? (order.completedAt ?? Date.now()) : undefined,
      completedLessons,
    });
    return { completedLessons };
  },
});

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function diplomaCode(courseNumber: number) {
  const part = Array.from(
    { length: 8 },
    () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
  ).join("");
  return `IPB-C${courseNumber}-${part.slice(0, 4)}-${part.slice(4)}`;
}

/** Issues (or renames) the diploma. Requires every lesson to be marked done. */
export const issueDiploma = mutation({
  args: {
    courseSlug: v.string(),
    email: v.string(),
    lessonIds: v.array(v.string()),
    name: v.string(),
    serviceKey: v.string(),
  },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const course = findCourse(args.courseSlug);
    const name = args.name.replaceAll(/\s+/g, " ").trim();
    if (!course || name.length < 2 || name.length > 80) {
      throw new Error("Invalid name");
    }
    const order = await paidOrder(ctx, args.email, course.slug);
    if (!order) {
      throw new Error("No access");
    }
    const done = new Set(order.completedLessons);
    if (
      args.lessonIds.length === 0 ||
      !args.lessonIds.every((id) => done.has(id))
    ) {
      throw new Error("not complete");
    }

    let code = order.diplomaCode;
    if (!code) {
      for (const _attempt of [1, 2, 3, 4, 5]) {
        if (code) {
          break;
        }
        const candidate = diplomaCode(course.number);
        const clash = await ctx.db
          .query("courseOrders")
          .withIndex("by_diploma_code", (q) => q.eq("diplomaCode", candidate))
          .unique();
        if (!clash) {
          code = candidate;
        }
      }
      if (!code) {
        throw new Error("Could not generate a code");
      }
    }
    const issuedAt = order.diplomaIssuedAt ?? Date.now();
    await ctx.db.patch(order._id, {
      completedAt: order.completedAt ?? issuedAt,
      diplomaCode: code,
      diplomaIssuedAt: issuedAt,
      diplomaName: name,
    });
    return { code, issuedAt, name };
  },
});

/** Public check of a diploma code: returns only what is printed on the diploma. */
export const verifyDiploma = query({
  args: { code: v.string(), serviceKey: v.string() },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const order = await ctx.db
      .query("courseOrders")
      .withIndex("by_diploma_code", (q) =>
        q.eq("diplomaCode", args.code.trim().toUpperCase())
      )
      .unique();
    if (!(order?.diplomaName && order.diplomaIssuedAt)) {
      return null;
    }
    return {
      courseSlug: order.courseSlug,
      issuedAt: order.diplomaIssuedAt,
      name: order.diplomaName,
    };
  },
});

// ── Admin (read-only) ──────────────────────────────────────────────────────

export const adminList = query({
  args: {
    paymentStatus: v.optional(
      v.union(v.literal("pending"), v.literal("paid"), v.literal("failed"))
    ),
    serviceKey: v.string(),
  },
  handler: async (ctx, args) => {
    assertServiceKey(args.serviceKey);
    const orders = await ctx.db.query("courseOrders").order("desc").collect();
    return args.paymentStatus
      ? orders.filter((o) => o.paymentStatus === args.paymentStatus)
      : orders;
  },
});
