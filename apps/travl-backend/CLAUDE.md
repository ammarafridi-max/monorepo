# CLAUDE.md — travl-backend

Scoped guidance for the **Travl** backend. Read the repo-root `CLAUDE.md` first — the monorepo conventions (domain factory pattern, DI, `getOrRegisterModel`, Stripe-webhook-before-`express.json()`, "How to work in this repo") all apply here and are not repeated.

## What Travl is

Travl (`travl.ae`, AED, `Asia/Dubai`) sells **travel insurance** to UAE residents, underwritten by AXA, plus day-by-day **travel itineraries** for visa files. That is the whole product surface: the `insurance` and `itineraries` domains.

**Visa assistance moved to VisaWadi** (`apps/visawadi-*`) in the 2026-08 brand split. The `visa`, `visa-leads`, `visa-applications` and `users` domains were unmounted and their packages removed from this app's dependencies. `/visa`, `/visa/[slug]` and `/apply` now 308 to visawadi.com from `next.config.mjs` in the frontend. Don't re-add any of it here.

Note the distinction: `/travel-insurance/*-visa` pages (schengen-visa, france-visa, uk-visa and so on) are **insurance products for visa applicants** and are Travl's best-performing pages. They stay.

This is *not* a ride/transfer brand — **there is no `bookings` domain here.** Travl does not sell dummy/verifiable flight tickets either; the `tickets`/`pricing` and `affiliates` domains were removed. Brand config: `packages/shared/config/src/brands/travl.js`.

## What's mounted (`src/routes/index.js`)

The composition root wires these domains — the set is brand-specific, so don't assume a domain exists just because another brand mounts it:

`auth`, `admin-users`, `blog` (+ blog-tags), `currencies`, `flights`, `airports`, `locations`, `itineraries`, `insurance`, `payments`.

The `flights`/`airports`/`locations` stack is mounted but **nothing calls it** — travl-frontend has no consumer. It still costs an AirLabs and a SerpApi key. Worth removing.

Travl-specific wiring worth knowing:
- **Blog is AI-assisted:** `createBlogRouter` receives `anthropicApiKey` — the blog content-generation/improve endpoints call Claude. (Marketing output must follow the house style in the root CLAUDE.md / memory.)
- **Flights use SerpApi (Google Flights) + AirLabs:** `createSerpApiClient` (flight search) alongside `createAirLabsClient` (airport/location data). Amadeus was removed.
- **Itineraries render as PDF in pure Node** (@react-pdf + pdf-to-img/canvas) — do **not** reintroduce Puppeteer or any headless browser.
- **Stripe webhook** success handlers here settle *itinerary*, *insurance*, and *payment-link* purchases (not transfer bookings) — respect idempotency: a resent event must never deliver an itinerary/policy or charge twice.

## Extra hardening (vs. other brand backends)

This backend adds request-sanitization middleware some siblings don't: **`express-mongo-sanitize`** and **`hpp`** (HTTP parameter pollution). Keep them in the middleware chain when editing `app.js`.

## Run it

```bash
pnpm turbo dev --filter=travl-backend...     # app + workspace deps in watch
# or from apps/travl-backend:
pnpm dev                                      # node --env-file=.env.development --watch
node --env-file=.env.development scripts/seed-admin.js
```
