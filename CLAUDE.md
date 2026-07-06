# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A pnpm + Turborepo monorepo ("travel-suite") hosting **six travel brands**, each a separate business but built from shared code: `airportrides`, `dt365`, `emirateslimo`, `mdt`, `travelshield`, `travl`. Every brand ships as two apps — a Next.js frontend (`apps/<brand>-frontend`) and an Express 5 + Mongoose 9 / MongoDB backend (`apps/<brand>-backend`). All the real logic lives in `packages/` and is composed per-brand.

Everything is ESM (`"type": "module"`), Node 22, React 19, Tailwind v4.

> Note: the root `README.md` is out of date — it lists only four brands and a flat `packages/` layout. Trust this file and the actual tree over the README.

## How to work in this repo

- Secrets are radioactive. Never echo .env files, never print API keys, webhook
  secrets (whsec_, sk_), or Mongo connection strings to the terminal, and never
  hardcode them in fly.*.toml. Secrets live only in Fly.io secrets.
- Correctness over "it runs." For anything touching payments, bookings, or
  webhooks, account for idempotency (Stripe retries and resends events),
  concurrency, and failure paths. A duplicate webhook must never double-issue a
  ticket or double-charge.
- There is no test suite. Never claim tests pass. When you finish, state plainly
  what you changed and what you did and did not verify.
- Do not commit or push unless I ask. Show me the diff first.
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
node --env-file=.env.development scripts/seed-admin.js   # seed an admin user
```

**Testing:** `turbo test` is wired but no test files or per-package `test` scripts exist yet — there is currently no test suite to run. **Linting** exists only on frontends (`next lint`); shared packages have no lint/build step (they're consumed as raw source via subpath exports).

## Architecture

### Brand configuration (`packages/shared/config`)
Brand identity (name, theme colors, feature flags, etc.) is resolved from a single env var: `BRAND` on backends, `NEXT_PUBLIC_BRAND` on Next.js. `getBrand(key)` looks up `src/brands/<brand>.js`; **every brand config is validated at module load**, so a misconfigured brand fails at startup, not at request time. Frontends also keep a thin local `src/config.js` reading `NEXT_PUBLIC_*` env vars (backend URL, GA4, brand default).

### Domain packages (`packages/domains/*`) — the core pattern
Each domain (bookings, payments, auth, blog, users, …) is a self-contained package that exports a **factory**, not a live router. The internal shape is consistent: `schema.js` → `service.js` → `controller.js` → `router.js`, stitched together by `index.js`:

```js
export function createBookingsRouter({ db, stripe }) {
  const Booking    = getOrRegisterModel(db, 'Booking', BookingSchema);
  const service    = createBookingService({ Booking, stripe });
  const controller = createBookingController({ service });
  const router     = createBookingRouter({ controller });
  return { router, service, controller };   // service/controller exposed for cross-wiring
}
```

Key conventions that flow from this:
- **Dependency injection everywhere.** Domain packages never import a DB connection, env, or client directly — they receive `db`, `stripe`, `auth`, `notifications`, `logger`, etc. as arguments. `mongoose`/`express` are `peerDependencies`.
- **`getOrRegisterModel(conn, name, schema)`** — idempotent Mongoose model registration (return existing model or register it). Reused in both domain packages and app route files to survive re-imports/hot-reload.
- The factory returns `service`/`controller` alongside `router` so the composition root can reuse them (e.g. mount extra routes, or call a service from a webhook handler).

### Backend composition root (`apps/<brand>-backend/src/routes/index.js`)
This is where a brand is assembled: it instantiates every domain factory with brand-specific config, wires the `notifications` service with that brand's identity/theme, creates the Stripe client, and mounts routers under `/api/*`. When editing backend behavior, this file is usually the map. Two things to respect:
- **The Stripe webhook handler is exported and mounted in `app.js` *before* `express.json()`** — it needs the raw body. Don't move it behind the JSON parser.
- Model pre-registration order can matter (see the "ORDER CRITICAL" comment) — schemas referenced by other schemas must register first.

### Frontend-shared (`packages/frontend-shared`)
A large shared library of React components, hooks, contexts, services, layouts, and full page components consumed by every frontend via **versioned subpath exports**:

```js
import HeroQuoteForm from '@travel-suite/frontend-shared/components/ui/v2/HeroQuoteForm';
import { apiBookings } from '@travel-suite/frontend-shared/services/apiBookings';
```

Components are grouped by kind (`ui`, `forms`, `form-elements`, `cards`, `sections`, `admin`, `pages`) and split into `v1`/`v2` folders — v2 is the current generation; brands migrate from v1 to v2 incrementally, so both exist side by side. Match the version already used by the app/page you're editing.

### Integrations (`packages/integrations/*`)
Thin typed clients for external services — `airlabs` (flight data), `brevo` (email), `cloudinary` (image storage/upload), `paypal`, `wis`. Also DI-based (`createXClient({ apiKey })`), injected at the composition root.

### Frontends
Next.js App Router (`src/app`). Each app has a root `proxy.js` (middleware) handling apex→www and legacy-path redirects, an `admin` section (dashboard) alongside the public marketing/booking pages, and TanStack Query + `react-hot-toast` for data/UX. Data fetching goes through `frontend-shared/services/*` against `NEXT_PUBLIC_BACKEND_URL`.

## Working conventions

- **Brand neutrality is strict:** shared packages and any given brand's app must never reference another brand by name. Keep defaults in `frontend-shared`/`config` brand-neutral; brand-specific strings belong in that brand's config or its own app.
- **Deployment** is Fly.io — per-app `fly.<brand>-<tier>.toml` at the repo root.
- When adding a domain, follow the schema→service→controller→router factory shape and wire it in each brand's `routes/index.js` that needs it — don't hardcode a connection or brand string inside the package.
