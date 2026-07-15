# IPB Migration Plan — Strapi + Nuxt + pnpm → Bun Monorepo + Convex + R2

**Handoff document.** Written 2026-07-14. Self-contained: an agent with access to `ipbitcoin/` (this repo) and `ipbitcoin-backend/` (sibling Strapi repo) can execute this plan without other context.

---

## 0. Executive summary

Migrate `institutobitcoin.pt` from:

|  | Current | Target |
| --- | --- | --- |
| Repo layout | Single Nuxt 4 app (`ipbitcoin/`) + separate Strapi repo (`ipbitcoin-backend/`) | One bun-workspaces monorepo: `apps/www`, `apps/admin`, `packages/ui`, `packages/backend` |
| CMS / DB | Strapi v5 (SQLite via better-sqlite3, local upload provider) | Convex (schema + queries/mutations), admin app replaces Strapi admin |
| Media | Strapi media library (`public/uploads`, ~28 MB) | Cloudflare R2 via `@convex-dev/r2`, served from custom domain |
| Package manager | pnpm 10 | bun (workspaces + catalogs) |
| Lint/format | Biome 2 | Ultracite v7 with oxlint + oxfmt provider |
| Hosting | Vercel (single project) + wherever Strapi runs | Vercel (two projects: www + admin) + Convex cloud + Cloudflare R2 |
| UI kit | reka-ui (only Accordion used today) | reka-ui, centralized in `packages/ui` |

**Where to build:** in a NEW folder (`c:\Users\psycarlo\Desktop\dev\ipbitcoin-v2` or similar), initialized as a fresh working tree. Do not restructure the existing repo in place — the old site must remain deployable until cutover. When the new site is verified, push it to the existing GitHub repo (`ipbitcoin/website`) as a branch (`monorepo`), open a PR, and cut over by merging + re-pointing Vercel. This keeps git history, the GitHub remote, and the current production deploy intact during the whole migration.

**Suggested execution order:** Phases are numbered and mostly sequential; Phase 3 (data migration scripts) can be developed in parallel with Phase 4 (www port) once Phase 2 (schema) is done.

---

## 1. Current state inventory (verified against both repos)

### 1.1 Content types (authoritative source: `ipbitcoin-backend/src/api/*/content-types/*/schema.json`)

All are collection types; there are no Strapi single types and no Strapi components. `L` = field localized (pt/en), Strapi stores one document per locale sharing a `documentId`.

| Collection | draftAndPublish | Fields | Relations |
| --- | --- | --- | --- |
| `articles` | yes | title(L), slug(L, unique), main_image(media, req), read_time(int, req), content(richtext L, req — markdown), audio(media L, optional) | category (manyToOne → categories), authors (manyToMany → authors) |
| `authors` | yes | name(req, NOT localized), description(text L), picture(media, req) | articles (inverse) |
| `categories` | **no** | name(L, req, unique), slug(L, req, unique), type(string, NOT localized — values `research`/`education`/`news`) | articles (inverse) |
| `team_members` | yes | picture(media req), name(not L), role(L), description(L), order(int, not L), linkedin(L, opt), nostr(L, opt) | — |
| `values` | yes | title(L, req, unique), description(L, req), order(int, not L, req) | — |
| `partners` | yes | name(req), logo(media req), link(opt), order(int req) — NOT localized | — |
| `faqs` | yes | question(L req), answer(text L req — rendered split on `\n`), order(int, not L, req) | — |
| `docs` | yes | title(L), document(media file req), order(int L, req, unique), description(text L) | — |
| `books` | yes | title(L req), author(string L req — plain text), description(L), pages(int L), year(int L), cover(media L), url(L), active(bool L, default true) | publisher (manyToOne → publishers) |
| `publishers` | no | name(req), slug(req, unique), website, description — NOT localized | books (inverse) |
| `trainings` | yes | start_date(datetime L req), end_date(datetime L), location(L req), location_url(L), stock(int, not L, req, min 0), stock_left(int, not L, req, min 0), active(bool, not L, default true) | enrollments (inverse) |
| `enrollments` | no | name, email(req), phone, birthday(date req), nif, payment_status(string req: pending/paid/failed), stripe_id, order_id, value(decimal), invoice, participated_workshop(bool), has_exposure(bool), bought_bitcoin(bool), has_self_custody(bool), expectations(text) | training (manyToOne) |
| `members` | no | name(req), birthday, citizen_card_number, fiscal_number(unique), address, email(req, unique), payment_plan(enum yearly/monthly, default yearly), payment_status(enum pending/active/expired/cancelled), stripe_customer_id, stripe_subscription_id | — |
| `newsletters` | no | email(req, unique), name | — |

Strapi backend: v5.21.0, SQLite, default local upload provider, `public/uploads` ≈ 28 MB, no custom controllers/lifecycles, empty `config/plugins.ts`.

### 1.2 Frontend surface (repo `ipbitcoin/`)

- Nuxt 4, `app/` srcDir, Tailwind v4 (CSS-first, single `--font-brand: Inter` token, accordion keyframes using `--reka-accordion-content-height`), light-only.
- i18n: `@nuxtjs/i18n`, `prefix_except_default`, pt default + en, route translations centralized in `nuxt.config.ts` `i18n.pages`, 135 leaf keys per locale file. A lot of bilingual copy is ALSO hardcoded in components with `locale === 'pt' ? … : …` (formacoes.vue, juntar.vue, IPBTrainingEnrollment.vue, manifesto.vue).
- Pages: `index`, `manifesto`, `contactos`, `equipa`, `juntar` (donations + membership), `formacoes` (static marketing + enrollment form), `noticias/index`, `educacao/index`, `investigacao/index`, `investigacao/[categoria]`, `artigo/[slug]`, `autor/[slug]`. Note: i18n config maps `educacao-categoria` but no such page file exists — drop or implement.
- Article content is a markdown string rendered with `<MDC>` + `@tailwindcss/typography`; custom MDC component `mdc/YoutubeVideo.vue` (props `title`, `link`).
- Author pages have no slug field — slug derived via `nameToSlug()` (`app/utils/name-to-slug.ts`, duplicated inline in the sitemap endpoint).
- SEO: `@nuxtjs/seo` (site config, schema.org Organization identity, robots, sitemap with dynamic source `/api/__sitemap__/urls`, `ogImage` disabled), hand-built JSON-LD blocks (FAQPage, Course, BreadcrumbList, ItemList, Article, Person) via `useHead` watchEffect, hreflang via `useLocaleHead`. RSS built by hand in `server/routes/rss.xml.ts` (+ `rss-en.xml.ts` re-export).
- Server routes (Nitro): `enrollments.post.ts` (training signup → Strapi enrollment + Stripe PaymentIntent €200), `member-register.post.ts` (member → Stripe Checkout subscription, monthly €20.83 / annual €250), `stripe-checkout.post.ts` (donations Checkout, one-time/monthly/yearly), `opennode-checkout.post.ts` (BTC donations), `stripe-webhook.post.ts` (HMAC-verified; updates members/enrollments/trainings), `opennode-webhook.post.ts` (HMAC-verified; log-only), `__sitemap__/urls.ts`, `rss.xml.ts`.
- All server-side Strapi calls use `Authorization: Bearer STRAPI_SECRET_KEY`; client reads are public.
- Components: `IPB*` prefix. Generic (→ `packages/ui`): `IPBButton` (tailwind-variants, polymorphic), `IPBTextInput`, `IPBSimNaoField`, `IPBCopyText`, `icon/*` (9 inline SVGs). Domain: `IPBArticleCard`, `IPBBookCard`, `IPBDocumentCard`, `IPBTeamMemberCard`, `IPBValueCard` (unused), `IPBPartner`, `IPBLanguageSelector`, `IPBLogo(-Inverse)`, `IPBTrainingEnrollment`.
- reka-ui usage today: Accordion family on the homepage FAQ only.
- Other deps to carry over: `motion-v` (homepage coin fade-in), `vue-sonner` (toasts), `@vueuse/nuxt` (`useWindowScroll`), `@vercel/analytics`, `@nuxt/image` (only for `/public` images on formacoes), `@nuxtjs/google-fonts` (Inter 300–700), `@stripe/stripe-js` (Payment Element), `tailwind-variants`, `qs` (likely droppable — was for Strapi queries).
- `vercel.json`: single www→apex redirect (keep).

### 1.3 Known bugs found during the audit (fix during port, do not replicate)

1. `useNewsletter.ts` POSTs to `/api/newsletter-subscribe` which does not exist on `main` (a `newsletters` content type exists in Strapi and an `origin/newsletter` branch exists). Implement properly in Convex.
2. `useNewsletter.ts` reads `config.public.substackUrl` (camelCase) but runtime config exposes `SUBSTACK_URL` — Substack silent-subscribe likely receives `undefined`.
3. `IPBTeamMemberCard.vue` — the nostr link's `:href` uses `linkedin` instead of `nostr`.
4. `NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is consumed in `nuxt.config.ts` but missing from `.env.example` — document it.
5. Error path in `useNewsletter.subscribe` calls `$toast.success`.
6. `stock_left` decrement (webhook) is read-then-write over REST — race-prone. Convex mutations are transactional; implement decrement atomically.
7. `.env.local` in the old repo contains committed live-looking secrets — do NOT copy it into the new repo; rotate the Stripe/Strapi/OpenNode keys after cutover.
8. `investigacao/[categoria].vue` hardcodes `type=research` even though i18n maps an education variant — decide: either add `educacao/[categoria]` support or remove the `educacao-categoria` i18n route entry.

---

## 2. Decisions (made; do not re-litigate unless blocked)

1. **New folder, same GitHub repo at the end.** Build in `ipbitcoin-v2/`, push as `monorepo` branch of `ipbitcoin/website`, merge to `main` at cutover.
2. **Convex integration:** `convex` + `convex-nuxt` module (wraps `convex-vue`, the integration Convex's own docs link). Pin exact versions — these are 0.1.x community packages. `useConvexQuery` for client reads (with `suspense()` for SSR), `ConvexHttpClient` (`convex/browser`) inside Nitro server routes.
3. **Convex code location:** `packages/backend` owns the `convex/` directory (schema, functions, `convex.config.ts` with the R2 component). Both apps import the generated `api` from it (`@ipb/backend`).
4. **Localization model:** merge Strapi's per-locale document pairs into ONE Convex document with localized field objects, e.g. `title: { pt: string, en: string }`. Non-localized fields stay scalar. Rationale: every page needs both locales' slugs for hreflang/language switching, halves document count, removes join-by-documentId logic. Slugs stay per-locale: `slug: { pt, en }` with indexes on `slug.pt` and `slug.en`.
5. **Draft/publish:** replace Strapi draftAndPublish with a `published: boolean` (or `publishedAt: number | null`) field on the content tables that had it. Public queries filter on it; admin sees everything.
6. **Media:** Cloudflare R2 via `@convex-dev/r2` (it has an official Vue entry point compatible with `convex-vue`). Store the R2 **key** on documents (e.g. `mainImageKey`), never full URLs. Serve publicly through a custom domain attached to the bucket (e.g. `cdn.institutobitcoin.pt`) — do NOT use `r2.dev` URLs in production (rate-limited, uncached). A tiny shared helper builds `https://cdn.institutobitcoin.pt/{key}`.
7. **Admin auth:** no third-party IdP. `apps/admin` uses `nuxt-auth-utils` (sealed session cookie) with a small allowlist of admin users (email + hashed password stored in Convex, or start with a single ADMIN_PASSWORD env). All admin writes go through the admin app's **Nitro server routes**, which call Convex public mutations that require a `serviceKey: v.string()` argument checked against a Convex env var (`SERVICE_KEY`, also set in the admin app's Vercel env). Public www mutations (enrollment, newsletter) do not need the key but must be rate-limit-conscious and validate inputs. If richer auth is wanted later, Clerk has a documented convex-nuxt path; Convex Auth is React-only — not an option.
8. **Lint/format:** Ultracite v7 with the oxlint provider (`npx ultracite init --linter oxlint`), extending only the `core` preset (no Vue preset exists). Accept the known limitation: oxlint lints `<script>` blocks only (no Vue template rules); oxfmt formats `.vue` (Prettier-conformant, pre-1.0 — pin versions). Single root config, root-level `ultracite check`/`fix` scripts.
9. **Bun:** package manager + workspaces + catalogs (shared dep versions in root `package.json` `workspaces.catalog`). Node stays the dev/build runtime for Nuxt (safest combo); Vercel handles runtime in prod.
10. **Payments:** keep flows identical (Stripe PaymentIntent for trainings, Checkout for donations/membership, OpenNode for BTC). Only the persistence layer changes: Strapi REST calls → Convex mutations via `ConvexHttpClient`. Keep the existing raw-HTTP Stripe integration style (no SDK today; keeping it avoids behavior drift — adding the `stripe` SDK is optional and out of scope).
11. **Newsletter:** implement the missing endpoint properly: Convex `newsletters` table + public mutation (idempotent on email), keep the client-side Substack silent-subscribe (fixing the env var case bug).
12. **Donations:** still not persisted (matches today's behavior). The OpenNode webhook keeps verifying HMAC and logging. Optional future table, out of scope.

---

## 3. Target architecture

```
ipbitcoin-v2/
├── package.json                # private, workspaces: ["apps/*", "packages/*"], catalog for shared deps
├── bun.lock
├── oxlint.config.js            # extends ultracite/oxlint/core
├── oxfmt.config.js             # spreads ultracite/oxfmt
├── tsconfig.json               # base config, path refs
├── .env.example
├── MIGRATION_PLAN.md           # this file
├── apps/
│   ├── www/                    # public site (port of current app, port 3000)
│   │   ├── nuxt.config.ts      # i18n, seo, mdc, convex-nuxt, tailwind, etc.
│   │   ├── app/                # pages, layouts, domain components, composables
│   │   ├── server/             # api routes (payments, webhooks, sitemap), routes (rss)
│   │   ├── public/             # static assets copied from old repo
│   │   └── vercel.json         # www→apex redirect (copied)
│   └── admin/                  # new CMS replacement (port 3001)
│       ├── nuxt.config.ts      # convex-nuxt, tailwind, packages/ui; no i18n/seo needed
│       ├── app/                # login, dashboard, CRUD pages per collection
│       └── server/             # session auth routes, proxied Convex writes
└── packages/
    ├── backend/                # "@ipb/backend"
    │   ├── package.json
    │   └── convex/
    │       ├── convex.config.ts    # app.use(r2)
    │       ├── schema.ts
    │       ├── articles.ts authors.ts categories.ts books.ts publishers.ts
    │       ├── teamMembers.ts values.ts partners.ts faqs.ts docs.ts
    │       ├── trainings.ts enrollments.ts members.ts newsletters.ts
    │       ├── r2.ts               # R2 component client + upload API
    │       └── migrate/            # one-time import mutations (deleted after cutover)
    └── ui/                     # "@ipb/ui" — Nuxt layer or plain Vue lib (see Phase 1)
        ├── package.json
        └── components/         # Button, TextInput, YesNoField, CopyText, icons/…
```

**Data flow:**

- www reads: `useConvexQuery(api.articles.listPublished, { … }).suspense()` — SSR-rendered, live-updating on client.
- www writes (enrollment, newsletter) + payment webhooks: Nitro server route → `ConvexHttpClient` → public mutation (input-validated; webhook-driven mutations require `serviceKey`).
- admin reads: `useConvexQuery` with full (unpublished included) queries that require `serviceKey` passed from server-provided session context — or simpler: admin reads also go through Nitro routes. Simplest consistent rule for v1: **all admin data access via Nitro server routes + ConvexHttpClient + serviceKey**; client-side live queries are a later nicety.
- Media upload (admin): server route gets a signed upload URL from the R2 component (`generateUploadUrl`/`syncMetadata`), browser PUTs the file, mutation stores the key on the target doc.

---

## 4. Phase 0 — Accounts & infrastructure prerequisites

Human/owner tasks (agent should produce exact instructions where it cannot do these itself):

1. Convex account + **one** project `ipbitcoin`. Convex's native model gives it two deployments: your personal **dev** deployment (`convex dev`) and one **production** deployment (`convex deploy`). Env vars are set per deployment; no second project needed.
2. Cloudflare: **two** R2 buckets so dev admin testing (uploads/deletes) never touches live media:
   - `ipbitcoin-media-dev` — dev. Enable public access via its `r2.dev` URL (rate-limited, fine for dev). No custom domain.
   - `ipbitcoin-media` — production. Attach custom domain `cdn.institutobitcoin.pt` (DNS is presumably already on Cloudflare; if not, this needs the zone). Never serve prod from `r2.dev`. One API token with Object Read & Write scoped to both buckets (or one token each). CORS policy per bucket allowing `GET, PUT` with `Content-Type` header — dev bucket: `http://localhost:3000`, `http://localhost:3001`; prod bucket: `https://institutobitcoin.pt`, `https://admin.institutobitcoin.pt`, Vercel preview URLs if needed.
3. Set Convex env vars **per deployment** (`bunx convex env set NAME value` for dev, `... --prod` for production): `R2_TOKEN`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`, `SERVICE_KEY` (random 32+ bytes, different per deployment), plus the per-deployment pair:
   - dev: `R2_BUCKET=ipbitcoin-media-dev`, `CDN_HOST=<bucket-hash>.r2.dev`
   - prod: `R2_BUCKET=ipbitcoin-media`, `CDN_HOST=cdn.institutobitcoin.pt` The media URL helper reads `CDN_HOST`, so all query results automatically point at the right bucket. `NUXT_PUBLIC_CDN_HOST` in the admin app must match its deployment's `CDN_HOST`.
4. Vercel: two new projects from the repo — `ipbitcoin-www` (root directory `apps/www`) and `ipbitcoin-admin` (root directory `apps/admin`). Enable "Include source files outside of the Root Directory". Add `CONVEX_DEPLOY_KEY` (production-scoped) to the www project only.
5. Keep the current Vercel project serving production until cutover (Phase 8).

---

## 5. Phase 1 — Scaffold the monorepo

1. `mkdir ipbitcoin-v2 && cd ipbitcoin-v2 && git init && bun init` — root `package.json`:
   ```jsonc
   {
     "name": "ipbitcoin",
     "private": true,
     "workspaces": {
       "packages": ["apps/*", "packages/*"],
       "catalog": {
         "nuxt": "<pin latest 4.x>",
         "vue": "<pin>",
         "reka-ui": "<pin>",
         "tailwindcss": "<pin 4.x>",
         "convex": "<pin>",
         "typescript": "<pin>",
       },
     },
     "scripts": {
       "dev": "bun run --filter './apps/*' dev",
       "dev:www": "bun --cwd apps/www dev",
       "dev:admin": "bun --cwd apps/admin dev",
       "dev:backend": "bun --cwd packages/backend dev",
       "build": "bun run --filter './apps/*' build",
       "lint": "ultracite check",
       "format": "ultracite fix",
     },
   }
   ```
2. `npx ultracite init --linter oxlint` at root (non-interactive). Verify it generates `oxlint.config.js` extending `ultracite/oxlint/core` and `oxfmt.config.js`. Do not enable React presets. Add `.vscode/settings.json` pointing format-on-save at the oxc extension.
3. Scaffold `apps/www` (fresh `nuxi init`, then port config) and `apps/admin` (fresh minimal Nuxt 4). Set `devServer.port` 3000/3001. Use `catalog:` for shared deps, `workspace:*` for `@ipb/ui` / `@ipb/backend`.
4. `packages/ui`: implement as a **Nuxt layer** (a `package.json` + `nuxt.config.ts` with `components/` auto-registered; apps add it via `extends: ['@ipb/ui']`). This keeps auto-import DX and lets the layer carry the shared Tailwind theme CSS. Contents (renamed, IPB prefix dropped inside the package; keep kebab/pascal consistency):
   - `UiButton` (from `IPBButton`, keep tailwind-variants API: variant primary/inverse/outline/subtle, size default/lg, as/to/href polymorphism)
   - `UiTextInput` (from `IPBTextInput`, defineModel, variants line/inverse)
   - `UiYesNoField` (from `IPBSimNaoField` — take labels as props instead of reading locale inside, so the package stays i18n-agnostic)
   - `UiCopyText` (from `IPBCopyText` + `truncate-address` util)
   - `Icon*` (the 9 SVG icon components)
   - shared `theme.css`: Tailwind `@theme` tokens (`--font-brand`), reka accordion keyframes
   - reka-ui as a peer/catalog dep; admin app will use more of it (Dialog, Select, Tabs, Toast or vue-sonner, Table primitives as needed)
5. `packages/backend`: `bunx convex init` inside it (creates `convex/`). `package.json` name `@ipb/backend`, exports the generated `convex/_generated/api` and shared types. Script: `"dev": "convex dev"`.
6. Root `.env.example` listing every var (see §11 table).
7. Verify: `bun install` from root; `bun run dev:www` + `bun run dev:admin` + `bun run dev:backend` all boot; `bun run lint` passes on the scaffold.

---

## 6. Phase 2 — Convex schema & functions

`packages/backend/convex/schema.ts` — translate §1.1 with the localization decision (§2.4). Draft (field names in camelCase; keep a `strapiDocumentId` on every migrated table for idempotent import + redirects):

```ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const localized = (t: any) => v.object({ pt: t, en: t });
const loc = localized(v.string());
const locOpt = v.object({
  pt: v.optional(v.string()),
  en: v.optional(v.string()),
});

export default defineSchema({
  articles: defineTable({
    title: loc,
    slug: loc, // unique per locale — enforce in mutations
    content: loc, // markdown
    readTime: v.number(),
    mainImageKey: v.string(), // R2 key
    audioKey: v.optional(v.string()), // R2 key (audio/mp4)
    categoryId: v.optional(v.id("categories")),
    authorIds: v.array(v.id("authors")),
    published: v.boolean(),
    publishedAt: v.optional(v.number()),
    createdAt: v.number(), // preserve Strapi createdAt for sorting/RSS
    updatedAt: v.number(),
    strapiDocumentId: v.optional(v.string()),
  })
    .index("by_slug_pt", ["slug.pt"])
    .index("by_slug_en", ["slug.en"])
    .index("by_published_created", ["published", "createdAt"])
    .index("by_category", ["categoryId"]),

  authors: defineTable({
    name: v.string(),
    slug: v.string(), // NEW: materialize nameToSlug(name) — stop deriving client-side
    description: locOpt,
    pictureKey: v.string(),
    linkedin: v.optional(v.string()),
    published: v.boolean(),
    strapiDocumentId: v.optional(v.string()),
  }).index("by_slug", ["slug"]),

  categories: defineTable({
    name: loc,
    slug: loc,
    type: v.union(
      v.literal("research"),
      v.literal("education"),
      v.literal("news")
    ),
    strapiDocumentId: v.optional(v.string()),
  })
    .index("by_type", ["type"])
    .index("by_slug_pt", ["slug.pt"])
    .index("by_slug_en", ["slug.en"]),

  teamMembers: defineTable({
    name: v.string(),
    role: loc,
    description: loc,
    order: v.number(),
    pictureKey: v.string(),
    linkedin: v.optional(v.string()),
    nostr: v.optional(v.string()),
    published: v.boolean(),
    strapiDocumentId: v.optional(v.string()),
  }).index("by_order", ["order"]),

  values: defineTable({
    title: loc,
    description: loc,
    order: v.number(),
    published: v.boolean(),
    strapiDocumentId: v.optional(v.string()),
  }).index("by_order", ["order"]),
  partners: defineTable({
    name: v.string(),
    logoKey: v.string(),
    link: v.optional(v.string()),
    order: v.number(),
    published: v.boolean(),
    strapiDocumentId: v.optional(v.string()),
  }).index("by_order", ["order"]),
  faqs: defineTable({
    question: loc,
    answer: loc,
    order: v.number(),
    published: v.boolean(),
    strapiDocumentId: v.optional(v.string()),
  }).index("by_order", ["order"]),
  docs: defineTable({
    title: loc,
    description: locOpt,
    documentKey: loc /* file differs per locale */,
    order: v.number(),
    published: v.boolean(),
    strapiDocumentId: v.optional(v.string()),
  }).index("by_order", ["order"]),

  books: defineTable({
    title: loc,
    author: loc,
    description: locOpt,
    pages: v.optional(v.number()),
    year: v.optional(v.number()),
    coverKey: v.optional(v.string()),
    url: v.optional(v.string()),
    active: v.boolean(),
    publisherId: v.optional(v.id("publishers")),
    published: v.boolean(),
    strapiDocumentId: v.optional(v.string()),
  }).index("by_active", ["active"]),

  publishers: defineTable({
    name: v.string(),
    slug: v.string(),
    website: v.optional(v.string()),
    description: v.optional(v.string()),
    strapiDocumentId: v.optional(v.string()),
  }).index("by_slug", ["slug"]),

  trainings: defineTable({
    startDate: v.string(),
    endDate: v.optional(v.string()), // ISO datetimes
    location: loc,
    locationUrl: v.optional(v.string()),
    stock: v.number(),
    stockLeft: v.number(),
    active: v.boolean(),
    published: v.boolean(),
    strapiDocumentId: v.optional(v.string()),
  }).index("by_active", ["active"]),

  enrollments: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    birthday: v.string(),
    nif: v.optional(v.string()),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("failed")
    ),
    orderId: v.string(),
    value: v.number(),
    invoice: v.optional(v.string()),
    stripeId: v.optional(v.string()),
    participatedWorkshop: v.optional(v.boolean()),
    hasExposure: v.optional(v.boolean()),
    boughtBitcoin: v.optional(v.boolean()),
    hasSelfCustody: v.optional(v.boolean()),
    expectations: v.optional(v.string()),
    trainingId: v.id("trainings"),
    strapiDocumentId: v.optional(v.string()),
  })
    .index("by_stripe_id", ["stripeId"])
    .index("by_training", ["trainingId"]),

  members: defineTable({
    name: v.string(),
    email: v.string(),
    birthday: v.optional(v.string()),
    citizenCardNumber: v.optional(v.string()),
    fiscalNumber: v.optional(v.string()),
    address: v.optional(v.string()),
    paymentPlan: v.union(v.literal("yearly"), v.literal("monthly")),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("active"),
      v.literal("expired"),
      v.literal("cancelled")
    ),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    strapiDocumentId: v.optional(v.string()),
  })
    .index("by_email", ["email"])
    .index("by_subscription", ["stripeSubscriptionId"])
    .index("by_fiscal_number", ["fiscalNumber"]),

  newsletters: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
  }).index("by_email", ["email"]),
});
```

(`docs.documentKey` is localized because the Strapi field was localized — verify during data export whether pt/en actually differ; if identical, flatten to `v.string()`.)

**Functions per table** (`packages/backend/convex/<table>.ts`):

- Public queries used by www — mirror §1.2 query patterns, server-side sorted (fix the current client-side sorting): `articles.listPublished({ locale?, categoryType?, categorySlug?, authorId?, excludeSlug?, limit? })`, `articles.getBySlug({ slug, locale })`, `articles.related(...)`, `categories.listByType`, `faqs.list`, `values.list`, `partners.list`, `docs.list`, `books.listActive`, `teamMembers.list`, `authors.getBySlug`, `authors.list`, `trainings.listActive`, plus `sitemap.entries` and `rss.articles` convenience queries.
- Public mutations (www, no serviceKey): `newsletters.subscribe` (idempotent by email), `enrollments.create` (validates training active + stockLeft > 0, generates orderId, returns ids).
- Service mutations (require `serviceKey` arg, checked against `process.env.SERVICE_KEY` inside the function): `enrollments.setStripeId`, `enrollments.markPaid` (atomically decrements `trainings.stockLeft`), `enrollments.markFailed`, `members.create` (unique email/fiscalNumber checks → typed error), `members.activate`, `members.activateBySubscription`, `members.cancelBySubscription`, and full CRUD for every content table (create/update/delete/publish) for the admin app.
- `r2.ts`: instantiate the component, export `clientApi` (`generateUploadUrl`, `syncMetadata` with `checkUpload` validating serviceKey/session) and a `deleteObject` service mutation.

Verify: `bunx convex dev` typechecks; write a couple of smoke queries in the dashboard.

---

## 7. Phase 3 — Data migration (Strapi → Convex + R2)

Source of truth: run the local Strapi backend (`ipbitcoin-backend/`, SQLite) — but **first confirm whether local DB == production**. Production Strapi lives at `STRAPI_URL` (see old repo's Vercel env). Safest: export from PRODUCTION via `strapi export` on the prod instance, or REST-pull from `STRAPI_URL` with the existing API token. Decide based on access; the script below supports the REST path since it works against prod without shell access.

Write `packages/backend/scripts/migrate/` (bun scripts):

1. **`01-export.ts`** — pull everything from Strapi REST:
   - For each localized collection: `GET {STRAPI_URL}/api/<plural>?locale=pt&populate=*&pagination[pageSize]=100&pagination[page]=N` and same for `en`; paginate via `meta.pagination.pageCount`. Include `status=draft` variants? Strapi 5 REST returns published by default — also fetch `?status=draft` to not lose unpublished work (mark `published: false`).
   - Non-localized: single pass (partners, publishers, enrollments, members, newsletters, trainings — note trainings IS localized, include it in the locale pass).
   - `GET /api/upload/files?pagination[pageSize]=100...` for the media manifest.
   - Write raw JSON to `scratch/export/*.json`. Auth: `Authorization: Bearer $STRAPI_SECRET_KEY` (needs find/findOne permissions on all types — if some are blocked, temporarily grant them to the token or fall back to `strapi export --no-encrypt --format dir` on the backend and parse `entities/*.jsonl` + `links/*.jsonl`).
2. **`02-merge-locales.ts`** — group localized entries by `documentId`, produce one merged record `{ field: { pt, en } }`; report any documentId with a missing locale (fallback: copy the existing locale into both, flag for manual review).
3. **`03-media-to-r2.ts`** — for every referenced upload: download from Strapi, upload to R2 with an S3 client (bun + `@aws-sdk/client-s3` against `R2_ENDPOINT`) under key `strapi/<hash><ext>` (or preserve original filename), emit `mediaMap.json` (strapi file id/url → r2 key). ~28 MB total, trivial volume. Include `Article.audio`, `Doc.document` files.
4. **`04-import.ts`** — call a Convex `internalMutation` (via `npx convex run migrate:importAll` reading the JSON through an action, or chunked `ctx.runMutation` calls) that inserts in dependency order: publishers → categories → authors → books/articles/... resolving relations through in-memory `Map<strapiDocumentId, Id<table>>`. Idempotent: skip/patch when `strapiDocumentId` already exists (allows re-runs). Preserve `createdAt`/`updatedAt`/`publishedAt` from Strapi into the explicit fields.
5. **`05-verify.ts`** — assertions: per-table counts match export; every `articles.mainImageKey` exists in R2 (HEAD via S3 client); every article has category + ≥1 author (or is flagged); slug uniqueness per locale; spot-check 5 random articles' markdown byte-equality.

Run against the **dev** Convex deployment first; re-run against prod during cutover (scripts are idempotent, so a final delta re-run just before DNS/domain switch picks up late content edits).

---

## 8. Phase 4 — Port `apps/www`

Port the existing app file-by-file; it is a lift-and-shift except for the data layer. Keep visual output pixel-identical.

1. **nuxt.config.ts:** copy current config; remove `@nuxtjs/strapi`; add `convex-nuxt` (`convex: { url: process.env.CONVEX_URL }`); keep i18n pages map, site/schemaOrg/robots/sitemap/ogImage/seo blocks, googleFonts, motion-v, vue-sonner, mdc, vueuse, @vercel/analytics, @nuxt/image, tailwind vite plugin. `extends: ['@ipb/ui']`. Resolve §1.3 bug 8 (drop `educacao-categoria` route or add the page).
2. **Data layer swap:** replace each `useStrapi().find(...)` with `useConvexQuery(api.…, args)` + `await suspense()` inside `useAsyncData`-equivalent flows (convex-nuxt handles SSR; follow its docs pattern). Delete `useGetStrapiUrl`; replace with `mediaUrl(key)` helper (`https://{CDN_HOST}/{key}`) from a shared composable. Mapping table:

| Old call site | New Convex query |
| --- | --- |
| layout footer categories | `categories.listByType({ type: 'research' })` |
| index: faqs/values/partners/docs | `faqs.list` / `values.list` / `partners.list` / `docs.list` (server-sorted by order) |
| index: articles (split by type client-side) | `articles.listPublished({})` — keep client split, or 3 queries by type |
| noticias | `articles.listPublished({ categoryType: 'news' })` |
| investigacao index | `categories.listByType({ type:'research' })` + `articles.listPublished({ categoryType:'research' })` |
| investigacao/[categoria] | `categories.getBySlug({ slug, locale, type:'research' })` + `articles.listPublished({ categorySlug })` |
| educacao | `books.listActive({})` + `articles.listPublished({ categoryType:'education' })` |
| artigo/[slug] | `articles.getBySlug({ slug, locale })` + `articles.related({ categoryType, excludeSlug, limit: 3 })` |
| autor/[slug] | `authors.getBySlug({ slug })` + `articles.listPublished({ authorId })` — slug now stored, delete client-side name matching |
| equipa | `teamMembers.list()` |
| trainings fetch | `trainings.listActive()` |

3. **Localized fields:** components now receive `title[locale]` etc. Add a tiny `pick(loc, field)` helper or resolve locale inside the Convex queries (pass `locale` arg and return flattened shapes matching the OLD TS types — **recommended**, minimizes component churn: queries return `Article`-shaped objects identical to `types/Article.ts` but with absolute CDN URLs).
4. **Server routes:** port all of `server/api/*` + `server/routes/rss*.xml.ts` replacing Strapi `$fetch` calls with `ConvexHttpClient` query/mutation calls (service mutations pass `SERVICE_KEY`). Keep Stripe/OpenNode raw-HTTP logic and HMAC verification byte-for-byte. Implement `/api/newsletter-subscribe` (calls `newsletters.subscribe`). Fix §1.3 bugs 2, 5 in `useNewsletter`.
5. **Components/composables:** move generic ones' usages to `@ipb/ui` names; keep domain components in the app. Fix bug 3 (nostr href). Decide on `IPBValueCard`/`IPBCopyText` (unused — drop from app, CopyText lives in ui package anyway).
6. **Static assets:** copy `public/` wholesale (including the two Portuguese-named association PDFs, `llms.txt`, og-image, favicon). Copy `vercel.json` redirect.
7. **i18n:** copy `i18n/locales/*.json` + empty `i18n.config.ts` unchanged. (Consolidating hardcoded bilingual copy into JSON is OPTIONAL and should be a separate later PR — do not mix with the migration.)
8. Verify (acceptance): `bun --cwd apps/www dev` renders every route listed in §1.2 with real migrated dev-deployment data; language switcher works on every page; article markdown renders incl. a YoutubeVideo MDC block; RSS pt+en validate (W3C validator); `/sitemap.xml` contains article/category/author URLs with hreflang alternates; JSON-LD blocks present (view-source check on home, formacoes, artigo, equipa, educacao, autor); enrollment flow works end-to-end in dev mode (no Stripe key) and with Stripe test keys + `stripe listen`; donation + membership checkout redirects work with test keys; newsletter subscribe writes to Convex.

---

## 9. Phase 5 — Build `apps/admin`

New Nuxt app, desktop-first, no SEO/i18n modules needed (admin UI language: match team preference, PT is fine). Uses `@ipb/ui` + reka-ui primitives.

1. **Auth:** `nuxt-auth-utils`; `POST /api/login` checks credentials (start: `ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH` env; verify with argon2/bcrypt), sets sealed session. Global route middleware redirects unauthenticated → `/login`. Logout route. All `/api/**` handlers (except login) assert session.
2. **Server data proxy:** generic pattern — `server/api/[collection]/…` handlers calling `@ipb/backend` service queries/mutations with `SERVICE_KEY`. Keep it boring and explicit per collection.
3. **Pages:** dashboard (counts, recent enrollments/members), then CRUD per collection:
   - Articles: list (filter by category/published), editor page — form with pt/en tabs for localized fields, markdown textarea with preview (render via `@nuxtjs/mdc` for parity), image upload (R2 signed URL flow), audio upload, author multi-select, category select, read-time number, publish toggle, slug fields with uniqueness validation.
   - Authors, Categories, Team, Values, Partners, FAQs, Docs, Books, Publishers, Trainings: simple list + form pages (pt/en tabbed inputs where localized, order fields, media upload where applicable).
   - Enrollments: read-only table (filter by training + payment status), CSV export.
   - Members: read-only table + status filter, CSV export.
   - Newsletters: read-only list, CSV export.
4. **Media flow:** upload component → admin server route obtains signed URL via R2 component → browser PUT → `syncMetadata` → mutation patches the doc's key field; old key deleted via `deleteObject` on replace.
5. Verify: full content lifecycle — create draft article with image in admin → not visible on www → publish → visible on www without redeploy (Convex reactivity/SSR fresh read); edit team member; create training; enrollment shows up after test purchase.

---

## 10. Phase 6 — Deploy & wire Vercel

1. Push repo to GitHub `ipbitcoin/website` branch `monorepo`.
2. Vercel `ipbitcoin-www` project: root dir `apps/www`, framework Nuxt auto-detected, install `bun install` (auto via `bun.lock`), build command override: `cd ../../packages/backend && bunx convex deploy --cmd 'cd ../../apps/www && bun run build' --cmd-url-env-var-name CONVEX_URL` with `CONVEX_DEPLOY_KEY` env. (Only www runs `convex deploy`.) Env vars per §11.
3. Vercel `ipbitcoin-admin` project: root dir `apps/admin`, plain `bun run build`, env: `CONVEX_URL` (prod deployment URL, set manually), `SERVICE_KEY`, session secret (`NUXT_SESSION_PASSWORD`), admin credentials. Domain: `admin.institutobitcoin.pt`. Additionally protect with Vercel Deployment Protection or at least ensure robots noindex.
4. Preview deployments: optional — preview-scoped `CONVEX_DEPLOY_KEY` gives per-branch Convex backends; skip for v1 (previews can point at dev deployment).
5. Verify both preview URLs fully (repeat Phase 4/5 acceptance against preview).

---

## 11. Environment variables

| Var | Where | Notes |
| --- | --- | --- |
| One Convex project, two deployments (dev + prod); two R2 buckets (`ipbitcoin-media-dev` served via `r2.dev`, `ipbitcoin-media` served via `cdn.institutobitcoin.pt`). Convex vars are set per deployment and differ only in `R2_BUCKET`/`CDN_HOST`/`SERVICE_KEY`. |

| Var | Where | dev value | prod value |
| --- | --- | --- | --- |
| `CONVEX_URL` | www + admin (public) | dev deployment URL (from `packages/backend/.env.local`) | injected by `convex deploy` for www; set manually on admin Vercel project |
| `CONVEX_DEPLOY_KEY` | www Vercel project only | — | production-scoped, from Convex dashboard |
| `SERVICE_KEY` | Convex env + www server + admin server | random secret A | random secret B (different) |
| `R2_TOKEN`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT` | Convex env (per deployment) | same token may cover both buckets | 〃 |
| `R2_BUCKET` | Convex env | `ipbitcoin-media-dev` | `ipbitcoin-media` |
| `CDN_HOST` | Convex env | `<bucket-hash>.r2.dev` | `cdn.institutobitcoin.pt` |
| `NUXT_PUBLIC_CDN_HOST` | admin (media previews) | matches dev `CDN_HOST` | matches prod `CDN_HOST` |
| `APP_URL` | www server | `http://localhost:3000` | `https://institutobitcoin.pt` |
| `SUBSTACK_URL` | www public | optional | same |
| `NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | www public | test key | live key |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `OPENNODE_API_KEY` | www server | test keys / `stripe listen` secret | live — ROTATE at cutover (§1.3 bug 7) |
| `NUXT_SESSION_PASSWORD` | admin server | any 32+ chars | strong random |
| (migration only) `STRAPI_URL`, `STRAPI_SECRET_KEY` | local scripts | prod Strapi (source of truth) | same; delete after cutover |

Admin accounts are not env vars: rows created by hand in the Convex dashboard `adminUsers` table (per deployment), password set on first login.

Gotcha: Convex CLI writes `.env.local`; the old repo's `dev` script already uses `--dotenv .env.local` — keep that convention in both apps.

---

## 12. Phase 7 — Cutover

Content freeze window (announce to team; keep it short — the delta re-run makes this ~minutes of actual freeze):

1. Re-run migration scripts against prod Convex (idempotent delta).
2. Run `05-verify.ts` against prod; manually spot-check admin + a www preview pointed at prod Convex.
3. Merge `monorepo` → `main`. Point the domains: `institutobitcoin.pt` → `ipbitcoin-www` project (remove from old project), `admin.institutobitcoin.pt` → admin project. Keep the www→apex redirect.
4. Update the **Stripe webhook endpoint** (dashboard) to the new deployment if the URL changes (it shouldn't — same domain `/api/stripe-webhook`), and confirm `checkout.session.completed`, `invoice.payment_succeeded`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `customer.subscription.deleted` are all subscribed (note: current README's `stripe listen` line is missing the two payment_intent events — subscribe them). Same check for the OpenNode callback.
5. Rotate `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `OPENNODE_API_KEY` (they sat in a committed `.env.local`).
6. Post-cutover smoke tests in production: home, artigo (pt+en), rss.xml + rss-en.xml, sitemap.xml, live Stripe donation of €1, newsletter signup, admin login + publish a trivial edit.
7. Monitor Vercel + Convex logs and Search Console for 48h (sitemap re-submit; URL structure is unchanged so SEO impact should be nil).
8. Decommission: take Strapi offline after 2 weeks (keep a final `strapi export` archive + a copy of `public/uploads` in cold storage), archive `ipbitcoin-backend` repo, delete `packages/backend/convex/migrate/` + scripts, delete the old Vercel project.

---

## 13. Risks & watch-outs (read before starting)

1. **convex-nuxt / convex-vue are 0.1.x community packages.** Pin exact versions. Smoke-test SSR (`suspense()`) on the very first ported page (`equipa` is the simplest data page — port it first as the canary). If SSR proves flaky, fallback pattern: fetch via Nitro route + `ConvexHttpClient` with plain `useFetch` (loses live reactivity on www, which the public site doesn't need anyway). This fallback is acceptable for www; admin must still verify mutations work client→server→Convex.
2. **oxlint won't lint Vue templates** (script blocks only) and Ultracite has no Vue preset — extend `core`. Accept reduced template lint coverage (Biome didn't lint templates either, so this is not a regression vs today).
3. **Slug uniqueness + author slug materialization:** the migration script must detect collisions (two authors whose names slugify identically, duplicate article slugs across draft/published) and fail loudly, not dedupe silently.
4. **Localized media in Strapi:** `Article.audio`, `Book.cover`, `Doc.document` are localized fields — pt and en documents may reference different files. The merge step (Phase 3.2) must keep both when they differ (schema note in §6 re `docs.documentKey`); check `books.cover`/`articles.audio` actual data and flatten if always identical.
5. **`categories` had draftAndPublish: false** — no `published` field needed there; queries shouldn't filter it.
6. **Stripe flows must not regress.** Port webhook handler logic exactly (it encodes subtle behavior: membership activation via metadata, renewal lookup by subscription id, atomic-ish stock decrement — now genuinely atomic in a Convex mutation). Test with `stripe listen` before cutover, all five event types.
7. **Vercel build with workspace deps:** "Include source files outside of Root Directory" must be ON for both projects, and the convex deploy build command runs from `packages/backend` (relative `cd` from the app root dir — verify path resolution in the actual Vercel build log on the first deploy).
8. **Do not copy `.env.local` from the old repo.** Recreate env files from `.env.example`; rotate exposed keys at cutover.
9. **Bun as package manager, Node as runtime** — do not chase Bun-runtime edge cases in Nuxt; `bun run dev` executing Node-based Nuxt is the intended setup.
10. **Draft content:** the REST export must pull `status=draft` variants or unpublished work is lost. Verify draft counts vs the Strapi admin UI before declaring the export complete.
