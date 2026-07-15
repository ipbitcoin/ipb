import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import type { Validator } from "convex/values";

// Localized string pair: one Convex document holds both locales.
const localized = <T extends Validator<unknown, "required", string>>(t: T) =>
  v.object({ en: t, pt: t });

const loc = localized(v.string());
const locOpt = v.object({
  en: v.optional(v.string()),
  pt: v.optional(v.string()),
});

export default defineSchema({
  articles: defineTable({
    audioKey: v.optional(locOpt), // R2 keys (audio/mp4) — narration differs per locale
    authorIds: v.array(v.id("authors")),
    categoryId: v.optional(v.id("categories")),
    content: loc, // markdown
    createdAt: v.number(), // preserved from Strapi for sorting/RSS
    mainImageKey: v.string(), // R2 key
    published: v.boolean(),
    publishedAt: v.optional(v.number()),
    readTime: v.number(),
    slug: loc, // unique per locale — enforced in mutations
    importId: v.optional(v.string()),
    title: loc,
    updatedAt: v.number(),
  })
    .index("by_slug_pt", ["slug.pt"])
    .index("by_slug_en", ["slug.en"])
    .index("by_published_created", ["published", "createdAt"])
    .index("by_category", ["categoryId"]),

  authors: defineTable({
    description: locOpt,
    linkedin: v.optional(v.string()),
    name: v.string(),
    pictureKey: v.string(),
    published: v.boolean(),
    slug: v.string(), // materialized nameToSlug(name)
    importId: v.optional(v.string()),
  }).index("by_slug", ["slug"]),

  categories: defineTable({
    name: loc,
    slug: loc,
    importId: v.optional(v.string()),
    type: v.union(
      v.literal("research"),
      v.literal("education"),
      v.literal("news")
    ),
  })
    .index("by_type", ["type"])
    .index("by_slug_pt", ["slug.pt"])
    .index("by_slug_en", ["slug.en"]),

  teamMembers: defineTable({
    description: loc,
    linkedin: v.optional(v.string()),
    name: v.string(),
    nostr: v.optional(v.string()),
    order: v.number(),
    pictureKey: v.string(),
    published: v.boolean(),
    role: loc,
    importId: v.optional(v.string()),
  }).index("by_order", ["order"]),

  values: defineTable({
    description: loc,
    order: v.number(),
    published: v.boolean(),
    importId: v.optional(v.string()),
    title: loc,
  }).index("by_order", ["order"]),

  partners: defineTable({
    link: v.optional(v.string()),
    logoKey: v.string(),
    name: v.string(),
    order: v.number(),
    published: v.boolean(),
    importId: v.optional(v.string()),
  }).index("by_order", ["order"]),

  faqs: defineTable({
    answer: loc,
    order: v.number(),
    published: v.boolean(),
    question: loc,
    importId: v.optional(v.string()),
  }).index("by_order", ["order"]),

  docs: defineTable({
    description: locOpt,
    documentKey: loc, // file may differ per locale
    order: v.number(),
    published: v.boolean(),
    importId: v.optional(v.string()),
    title: loc,
  }).index("by_order", ["order"]),

  books: defineTable({
    active: v.boolean(),
    author: loc,
    coverKey: v.optional(v.string()),
    description: locOpt,
    pages: v.optional(v.number()),
    published: v.boolean(),
    publisherId: v.optional(v.id("publishers")),
    importId: v.optional(v.string()),
    title: loc,
    url: v.optional(v.string()),
    year: v.optional(v.number()),
  }).index("by_active", ["active"]),

  publishers: defineTable({
    description: v.optional(v.string()),
    name: v.string(),
    slug: v.string(),
    importId: v.optional(v.string()),
    website: v.optional(v.string()),
  }).index("by_slug", ["slug"]),

  trainings: defineTable({
    active: v.boolean(),
    endDate: v.optional(v.string()),
    location: loc,
    locationUrl: v.optional(v.string()),
    published: v.boolean(),
    startDate: v.string(), // ISO datetime
    stock: v.number(),
    stockLeft: v.number(),
    importId: v.optional(v.string()),
  }).index("by_active", ["active"]),

  enrollments: defineTable({
    birthday: v.string(),
    boughtBitcoin: v.optional(v.boolean()),
    email: v.string(),
    expectations: v.optional(v.string()),
    hasExposure: v.optional(v.boolean()),
    hasSelfCustody: v.optional(v.boolean()),
    invoice: v.optional(v.string()),
    name: v.string(),
    nif: v.optional(v.string()),
    orderId: v.string(),
    participatedWorkshop: v.optional(v.boolean()),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("failed")
    ),
    phone: v.optional(v.string()),
    importId: v.optional(v.string()),
    stripeId: v.optional(v.string()),
    trainingId: v.id("trainings"),
    value: v.number(),
  })
    .index("by_stripe_id", ["stripeId"])
    .index("by_training", ["trainingId"]),

  members: defineTable({
    address: v.optional(v.string()),
    birthday: v.optional(v.string()),
    citizenCardNumber: v.optional(v.string()),
    email: v.string(),
    fiscalNumber: v.optional(v.string()),
    name: v.string(),
    paymentPlan: v.union(v.literal("yearly"), v.literal("monthly")),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("active"),
      v.literal("expired"),
      v.literal("cancelled")
    ),
    importId: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
  })
    .index("by_email", ["email"])
    .index("by_subscription", ["stripeSubscriptionId"])
    .index("by_fiscal_number", ["fiscalNumber"]),

  newsletters: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    importId: v.optional(v.string()),
  }).index("by_email", ["email"]),

  // Admin app accounts. Rows are created by hand in the Convex dashboard
  // (invite-only); the password hash is set on first login.
  adminUsers: defineTable({
    active: v.boolean(),
    email: v.string(),
    name: v.optional(v.string()),
    passwordHash: v.optional(v.string()),
  }).index("by_email", ["email"]),
});
