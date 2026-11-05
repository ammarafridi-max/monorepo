# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A pnpm + Turborepo monorepo ("travel-suite") hosting **seven travel brands**, each a separate business but built from shared code: `airportrides`, `dt365`, `emirateslimo`, `mdt`, `thedt`, `travl`, `visawadi`. Each has a brand config in `packages/shared/config/src/brands/` and a pair of `fly.<brand>-*.toml` files at the repo root.

`travelshield` was discontinued and its apps deleted. The brand config and the registry entry are gone too, so there is nothing live left to trip over. The only remaining mentions are inside dated files under `docs/audits/`, which are historical records and are not describing the current tree.

**Picturesk** (`apps/picturesk-frontend`, `apps/picturesk-backend`, `packages/picturesk-shared`) also lives here but is NOT a travel brand: it is an AI headshot generator with its own Mongo database and its own brand identity (`docs/picturesk/BRAND.md`). It does not use `@travel-suite/config`, and its customer-facing site is plain CSS rather than Tailwind. It is the only thing here with a queue worker (Redis + BullMQ), R2 storage, and Sentry. Do not pull it into the brand machinery, and do not let its dependencies leak into the travel packages.

`picturesk-backend` is one package with **two entrypoints** — `src/server.js` (HTTP) and `src/worker.js` (BullMQ) — built from one Dockerfile via `build-target` and deployed as two Fly apps with different lifecycles. Its admin UI does use `frontend-shared`. The Fly app names are still `picturesk-api` / `picturesk-worker` / `picturesk-web`, deliberately: renaming them would mean re-pointing DNS and reissuing certs for no gain.

The split in progress: **travl** is narrowing toward travel insurance and itineraries, and **visawadi** has taken all visa assistance (travl-backend mounts no visa routes at all now). The narrowing is not finished: travl still mounts `tickets`, `pricing` and `affiliates`. Every brand ships as two apps: a Next.js frontend (`apps/<brand>-frontend`) and an Express 5 + Mongoose 9 / MongoDB backend (`apps/<brand>-backend`). All the real logic lives in `packages/` and is composed per-brand.

Everything is ESM (`"type": "module"`), Node 22, React 19, Tailwind v4.

> The root `README.md` covers the same ground more briefly and is kept in step with this file. Where they ever disagree, trust the actual tree, then this file.

**Scheduled jobs live in `automations/`** — one workspace package holding every cron: blog generation per brand, the blog backlog scheduler, the Emirates Limo pricing sync. One entrypoint (`node src/cli.mjs <job> [--target <key>]`), one reusable GitHub workflow with thin per-job callers, and a config schema that validates every target at load. Every job supports `--dry-run`, and a dry run needs no credentials so CI can exercise it on a pull request. Add a job there rather than dropping a script at the repo root or under an app. See `automations/README.md`.

## How to work in this repo

- Secrets are radioactive. Never echo .env files, never print API keys, webhook
  secrets (whsec_, sk_), or Mongo connection strings to the terminal, and never
  hardcode them in fly.*.toml. Secrets live only in Fly.io secrets.
- Correctness over "it runs." For anything touching payments, bookings, or
  webhooks, account for idempotency (Stripe retries and resends events),
  concurrency, and failure paths. A duplicate webhook must never double-issue a
  ticket or double-charge.
- Tests exist in exactly six places, all `node --test`: `apps/picturesk-backend`,
  `packages/domains/assistant`, `packages/domains/tickets`,
  `packages/domains/openai-ads`, `packages/integrations/google-ads-conversions`
  and `packages/shared/utils`. Everything else has none, the travel apps
  included. Run them and they pass. Never claim tests pass for code they do not
  cover. When you finish, state plainly what you changed and what you did and
  did not verify.
- Do not commit or push unless I ask. Show me the diff first.
- **Do not write comments.** This is the default, not a preference to balance
  against. No file-header essays, no section banners, no JSDoc blocks, no
  restating what the code says, no notes about what the code used to do, no
  explaining a decision you just made. If you want to explain something, put it
  in your reply to me, not in the file. Name things well and the code explains
  itself.
  The only exceptions, and they are narrow:
  - Functional comments that do work: eslint-disable, ts-expect-error,
    prettier-ignore, istanbul ignore, webpack magic comments, shebangs.
  - The usage lines at the top of a runnable script.
  - A constraint that is invisible in the code and whose absence would let
    someone reintroduce a real bug: an ordering requirement, a raw-body or
    idempotency contract, a route that must stay above another. One line, stating
    the constraint and nothing else.
  If you are unsure whether a comment qualifies, it does not. Write none.
- Content and marketing copy follow my house style: conversational, no em dashes,
  no AI-sounding filler, GEO-optimized (verdict first, the title question repeated
  as an H2 above a 40 to 80 word answer, FAQ structure) and conversion-focused
  with a natural CTA toward the relevant product.

## Commands

Root scripts run through Turbo across the workspace:

```bash
pnpm install                              # bootstrap (pnpm 9, see packageManager field)
pnpm dev / build / lint / test            # turbo run <task> across all workspaces
```

Work on a single app (this is the normal dev loop):

```bash
pnpm turbo dev --filter=airportrides-frontend      # one app
pnpm turbo dev --filter=airportrides-backend...    # app + its workspace deps in watch mode
pnpm turbo build --filter=mdt-frontend
```

Add a dependency to one workspace:

```bash
pnpm add <pkg> --filter=<workspace-name>
```

Backends run directly on Node's built-in watcher and env-file loader (no nodemon/dotenv):

```bash
# from apps/<brand>-backend — dev uses .env.development, start uses .env.production
pnpm dev        # node --env-file=.env.development --watch src/server.js
```

**Testing:** the travel apps have no tests. Six workspaces do, all `node --test`, 294 tests in total and all passing with no DB or network:

| Workspace | Tests | Covers |
|---|---|---|
| `apps/picturesk-backend` | 86 | the generation pipeline, tiers, rate limits, the face quality gate |
| `packages/domains/assistant` | 70 | the admin assistant's access gates, query building, Stripe maths and ads proposals |
| `packages/domains/tickets` | 79 | dummy ticket pricing, currency conversion, and the Stripe/PayPal checkout and webhook amounts |
| `packages/domains/openai-ads` | 23 | editing and replacing an ad, audience hint normalisation, bid resets, reading review and rejection state |
| `packages/integrations/google-ads-conversions` | 11 | when an upload is skipped, identifier hashing, commission vs gross value, refund adjustments, token reuse |
| `packages/shared/utils` | 25 | currency decimals and minor-unit conversion |

A root `pnpm test` runs those six and nothing else. Note `google-ads-conversions` is an *integration*, not a domain, despite being the only tested one.

**Linting** exists only on frontends, as a bare `"lint": "eslint"` against a flat `eslint.config.mjs` per app (not `next lint`, which is gone). `picturesk-frontend` has no lint script. `frontend-shared` has one (`npx eslint src`); the other shared packages have no lint or build step at all, since they are consumed as raw source via subpath exports.

## Architecture

### Brand configuration (`packages/shared/config`)
Brand identity (key, name, domain, currency, timezone, locale, emails, theme colors, SEO defaults, legal details) is resolved from a single env var: `BRAND` on backends, `NEXT_PUBLIC_BRAND` on Next.js. `getBrand(key)` looks up `src/brands/<brand>.js`; **every brand config is validated at module load**, so a misconfigured brand fails at startup, not at request time.

There is no longer a `features` block. The flags were removed once it turned out nothing read them, so a brand's product surface is defined by what its backend mounts and what its frontend routes, not by a config flag. Don't reintroduce them to gate a feature.

### Shared backend app (`packages/shared/backend-app`)
All seven travel backends are now thin. This package owns the scaffolding they used to each copy:

- `createApp({ brandKey, config, router, webhooks, staticMounts })` builds the whole Express app: request context and logging, raw-body webhook mounts, helmet/cors/compression/cookie-parser/json, the `/api` rate limit, static mounts, `/health`, and the 404 plus global error handler.
- `startServer` (the bootstrap) and `createDb` (the Mongoose connection).
- `createBackendConfig` and `validateBackendEnv` (from `./config` and `./validate-env`): the env to config map and its startup validation.
- `createBrandMailer`, `createBrandStorage` (Cloudinary, foldered per brand), `createBrandNotifications`, `createInsuranceEmails`, `createPaymentLinkSuccessHandler`, `createWis`, and the tracking constructors in `./tracking`: `createGoogleAdsConversions`, `createMetaCapi`, `createOpenAICapi`, `createTicketConversionCounter`.

An app's `src/app.js`, `src/server.js` and `src/utils/*` are now mostly one call each into this. When you need to change behaviour for every brand, change it here; when you need it for one brand, change that brand's composition root.

### Domain packages (`packages/domains/*`) — the core pattern
Each domain (payments, auth, blog, tickets, hotel-bookings, visa-applications, …) is a self-contained package that exports a **factory**, not a live router. The internal shape is consistent: `schema.js` → `service.js` → `controller.js` → `router.js`, stitched together by `index.js`:

```js
export function createTransferBookingsRouter({ db, stripe, auth }) {
  const TransferBooking = getOrRegisterModel(db, 'transfer-booking', TransferBookingSchema);
  const service    = createTransferBookingService({ Booking: TransferBooking, stripe });
  const controller = createTransferBookingController({ service });
  const router     = createBookingRouter({ controller, auth });
  return { router, service, controller };
}
```

Key conventions that flow from this:
- **Dependency injection everywhere.** Domain packages never import a DB connection, env, or client directly — they receive `db`, `stripe`, `auth`, `notifications`, `logger`, etc. as arguments. `mongoose`/`express` are `peerDependencies`.
- **`getOrRegisterModel(db, name, schema)`** from `@travel-suite/utils/model`, idempotent Mongoose model registration (return the existing compiled model, or register it). One shared helper, no longer copied per domain. Reused in both domain packages and app route files to survive re-imports and hot-reload.
- The factory returns `service`/`controller` alongside `router` so the composition root can reuse them (e.g. mount extra routes, or call a service from a webhook handler).

### Backend composition root (`apps/<brand>-backend/src/routes/index.js`)
This is where a brand is assembled: it instantiates every domain factory with brand-specific config, wires the `notifications` service with that brand's identity/theme, creates the Stripe client, and mounts routers under `/api/*`. When editing backend behavior, this file is usually the map. Two things to respect:
- **The Stripe webhook handler is exported and passed to `createApp` as a `webhooks` entry, which mounts it with a raw body parser *before* `express.json()`.** Don't move it behind the JSON parser.
- Where a schema is referenced by another schema, its models have to register first. In practice the only case left is `registerAffiliateModels({ db })`, which dt365, mdt, thedt and travl call at the top of the file before anything that refs an affiliate. Keep that call where it is.

Not every brand mounts every domain, and the sets differ a lot. Read the brand's own `routes/index.js` rather than assuming, and don't take one brand's surface as a template for another. As of now: airportrides is transfers (`transfer-bookings`, currencies, locations); emirateslimo is limos (vehicles, zones, pricing-rules, availability-rules); dt365, mdt and thedt are dummy tickets (`tickets` + `pricing` + `affiliates` + `openai-ads`, with dt365 adding hotel bookings and WhatsApp conversations, and mdt and thedt adding insurance); travl is insurance and itineraries but still mounts tickets, pricing and affiliates; visawadi owns all the visa routes (`visas`, `visa-applications`, `visa-requirements`, `visa-leads`) plus customer `users`.

### Frontend-shared (`packages/frontend-shared`)
A large shared library of React components, hooks, contexts, services, layouts, and full page components consumed by every frontend via **versioned subpath exports**:

```js
import HeroQuoteForm from '@travel-suite/frontend-shared/components/ui/v2/HeroQuoteForm';
import { apiBookings } from '@travel-suite/frontend-shared/services/apiBookings';
```

Components are grouped by kind (`ui`, `forms`, `form-elements`, `cards`, `sections`, `admin`, `pages`) and split into `v1`/`v2` folders — v2 is the current generation; brands migrate from v1 to v2 incrementally, so both exist side by side. Match the version already used by the app/page you're editing.

`src/seo/` is the newer half of this package and is now the map for a frontend's SEO scaffolding, the way `backend-app` is for a backend. It owns `metadata.js` (the root `metadata` object a brand's `layout.js` builds from), `robots.js`, `sitemap.js` (the shared content entries each app's `sitemap.js` composes), `schema.js` (the brand's schema.org graph), `siteUrl.js` and `NotFoundPage.js`. A brand's `layout.js`, `robots.js`, `sitemap.js`, `not-found.js` and `lib/schema.js` are thin wrappers over these.

### Integrations (`packages/integrations/*`)
Twelve thin typed clients for external services: `airlabs` (flight data), `brevo` (email), `cloudinary` (image and file storage), `google-ads-conversions`, `meta-capi`, `openai-ads`, `openai-capi`, `paypal`, `serpapi` (Google Flights and hotels), `transferz` (transfer supply), `whatsapp` (Cloud API), `wis` (AXA insurance). Also DI-based (`createXClient({ apiKey })`), injected at the composition root. Note `openai-ads` exists as both an integration (the API client) and a domain (the admin surface over it, published as `@travel-suite/openai-ads-admin`).

### Frontends
Next.js App Router (`src/app`), an `admin` section (dashboard) alongside the public marketing and booking pages, and TanStack Query + `react-hot-toast` for data and UX. Data fetching goes through `frontend-shared/services/*` against `NEXT_PUBLIC_BACKEND_URL`.

**There is no middleware in any app.** No `proxy.js`, no `middleware.js`. Apex to www and every legacy-path redirect is an `async redirects()` entry in that app's `next.config.mjs`, which is also where new ones go. This is deliberate and worth not undoing: every frontend ships `output: 'standalone'`, under which Next silently ignores middleware, so a reintroduced middleware file would look right and do nothing.

Only some frontends keep a local `src/config.js` reading `NEXT_PUBLIC_*` vars (airportrides, mdt and thedt do; the rest read the env directly or use `src/config/`). Don't assume one exists.

## Working conventions

- **Brand neutrality is strict:** shared packages and any given brand's app must never reference another brand by name. Keep defaults in `frontend-shared`/`config` brand-neutral; brand-specific strings belong in that brand's config or its own app.
- **Deployment** is Fly.io — per-app `fly.<brand>-<tier>.toml` at the repo root.
- When adding a domain, follow the schema→service→controller→router factory shape and wire it in each brand's `routes/index.js` that needs it — don't hardcode a connection or brand string inside the package.
