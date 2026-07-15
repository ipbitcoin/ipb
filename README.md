# institutobitcoin.pt — monorepo

Bun-workspaces monorepo for the Instituto Português de Bitcoin website, replacing the old Nuxt + Strapi split.

## Layout

| Path | What |
| --- | --- |
| `apps/www` | Public site (Nuxt 4, port 3000). SSR reads from Convex via `ConvexHttpClient` inside `useAsyncData` — fully server-rendered for SEO. |
| `apps/admin` | CMS replacement (Nuxt 4, port 3001). Config-driven CRUD over every collection, media upload to R2, session auth via `nuxt-auth-utils`. |
| `packages/backend` | `@ipb/backend` — Convex schema, queries/mutations, R2 component, one-time Strapi migration scripts. |
| `packages/ui` | `@ipb/ui` — shared Nuxt layer: `UiButton`, `UiTextInput`, `UiYesNoField`, `UiCopyText`, `Icon*`, Tailwind theme tokens. |

## Dev

```sh
bun install
bun run dev:backend   # convex dev (writes CONVEX_URL to packages/backend/.env.local)
bun run dev:www       # http://localhost:3000
bun run dev:admin     # http://localhost:3001
bun run lint          # ultracite check (oxlint + oxfmt)
bun run format        # ultracite fix
```

Each app reads `.env.local` (see its `.env.example`). Bun is the package manager; Node runs Nuxt.

## Data model notes

- One Convex document per content entry, with localized fields as `{ pt, en }` pairs. Public queries take a `locale` arg and return flattened, old-frontend-shaped objects with absolute CDN media URLs.
- Media lives in Cloudflare R2 (`@convex-dev/r2`); documents store the R2 **key**, URLs are built as `https://$CDN_HOST/<key>`.
- Draft/publish is a `published` boolean; public queries filter it, admin sees everything.
- `importId` on migrated tables is the old Strapi documentId — used only by the idempotent import scripts; delete after cutover.

## Auth (admin)

Invite-only. Create a row in the Convex dashboard (`adminUsers` table): `{ email, active: true }`. On first login the invitee sets their password (scrypt hash stored in Convex). Deactivate with `active: false` or delete the row.

## Migration (Strapi → Convex + R2)

Scripts in `packages/backend/scripts/migrate/`, run in order with env vars per script header:

1. `01-export.ts` — pull all collections (pt+en, published+drafts) + media manifest from Strapi REST
2. `02-merge-locales.ts` — merge per-locale documents by documentId
3. `03-media-to-r2.ts` — upload all media to R2, emit media map
4. `04-import.ts` — transform + import into Convex (idempotent, dependency-ordered)
5. `05-verify.ts` — counts, R2 HEAD checks, slug uniqueness, content spot-checks

Re-runnable: a final delta run just before cutover picks up late edits.

## Deploy (Vercel)

Convex functions deploy via GitHub Actions (`.github/workflows/convex-deploy.yml`) on pushes to `main` that touch `packages/backend/convex/**` — repo secret `CONVEX_DEPLOY_KEY` (production deploy key from the Convex dashboard). Vercel never runs `convex deploy`.

Two Vercel projects from this repo (enable "Include source files outside of Root Directory"):

- **www** — root `apps/www`, default build (`bun run build`), env per `apps/www/.env.example` with `CONVEX_URL` set manually to the production deployment URL.
- **admin** — root `apps/admin`, default build, env per `apps/admin/.env.example`. Domain `admin.institutobitcoin.pt`, noindex.

Order matters on schema changes: the Convex workflow must run before (or without) app redeploys that depend on new functions — push backend changes first or rerun the app deploy after.

One Convex project, two deployments (dev via `convex dev`, prod via `convex deploy`). Two R2 buckets: `ipbitcoin-media-dev` (public `r2.dev` URL) and `ipbitcoin-media` (custom domain `cdn.institutobitcoin.pt`). Per-deployment Convex env vars: `SERVICE_KEY`, `CDN_HOST`, `R2_TOKEN`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`, `R2_BUCKET` — dev points at the dev bucket/`r2.dev` host, prod at the prod bucket/CDN domain.

See `MIGRATION_PLAN.md` for the full cutover runbook (Stripe webhook events, key rotation, DNS switch).

### Deploy: 1
