# CLAUDE.md — travl-backend

Scoped guidance for the **Travl** backend. Read the repo-root `CLAUDE.md` first — the monorepo conventions (domain factory pattern, DI, `getOrRegisterModel`, Stripe-webhook-before-`express.json()`, "How to work in this repo") all apply here and are not repeated.

## What Travl is

Travl (`travl.ae`, AED, `Asia/Dubai`) sells **visa-application support documents** to UAE residents: dummy/verifiable flight tickets, travel itineraries, and travel insurance, plus visa services. This is *not* a ride/transfer brand — **there is no `bookings` domain here.** The product surface is instead spread across the `tickets`, `itineraries`, `insurance`, `visa`, and `visa-leads` domains. Brand config: `packages/shared/config/src/brands/travl.js` (feature flags: `dummyTickets` on, `insurance` on, `hotelVouchers` off).

## What's mounted (`src/routes/index.js`)

The composition root wires these domains — the set is brand-specific, so don't assume a domain exists just because another brand mounts it:

`auth`, `admin-users`, `blog` (+ blog-tags), `visa`, `visa-leads`, `currencies`, `flights`, `airports`, `locations`, `tickets`, `pricing`, `itineraries`, `insurance`, `affiliates`, `payments`, `email-support`, `users`.

Travl-specific wiring worth knowing:
- **Blog is AI-assisted:** `createBlogRouter` receives `anthropicApiKey` — the blog content-generation/improve endpoints call Claude. (Marketing output must follow the house style in the root CLAUDE.md / memory.)
- **Flights use Amadeus + AirLabs:** `createAmadeusClient` (flight search/pricing) alongside `createAirLabsClient` (airport data).
- **Itineraries render as PDF in pure Node** (@react-pdf + pdf-to-img/canvas) — do **not** reintroduce Puppeteer or any headless browser.
- **Visa leads** capture prospects and notify via the `notifications` service (`createVisaLeadRouter({ ..., notificationsService })`).
- **Stripe webhook** success handlers here settle *document/insurance* purchases (not transfer bookings) — respect idempotency: a resent event must never issue a ticket or charge twice.

## Extra hardening (vs. other brand backends)

This backend adds request-sanitization middleware some siblings don't: **`express-mongo-sanitize`** and **`hpp`** (HTTP parameter pollution). Keep them in the middleware chain when editing `app.js`.

## Run it

```bash
pnpm turbo dev --filter=travl-backend...     # app + workspace deps in watch
# or from apps/travl-backend:
pnpm dev                                      # node --env-file=.env.development --watch
node --env-file=.env.development scripts/seed-admin.js
```
