# CLAUDE.md — travl-backend

Scoped guidance for the **Travl** backend. Read the repo-root `CLAUDE.md` first: the monorepo conventions (domain factory pattern, DI, `getOrRegisterModel`, the raw-body Stripe webhook, `@travel-suite/backend-app`, "How to work in this repo") all apply here and are not repeated.

## What Travl is

Travl (`travl.ae`, AED, `Asia/Dubai`) sells **travel insurance** to UAE residents, underwritten by AXA via WIS, plus day-by-day **travel itineraries** for visa files. Those are the products the brand leads on.

It is not the whole mounted surface, though, and that gap matters: Travl **also still mounts `tickets`, `pricing` and `affiliates`**, so dummy/verifiable flight reservations are sold and commissioned here. The narrowing toward insurance and itineraries is a direction, not a finished state. Check `src/routes/index.js` before concluding a domain is gone.

**Visa assistance moved to VisaWadi** (`apps/visawadi-*`) in the 2026-08 brand split. The `visa`, `visa-leads`, `visa-applications` and `users` domains were unmounted and their packages removed from this app's dependencies, and nothing visa-shaped is mounted here now. `/visa`, `/visa/[slug]` and `/apply` 308 to visawadi.com from the frontend's `next.config.mjs`. Don't re-add any of it here.

Note the distinction: `/travel-insurance/*-visa` pages (schengen-visa, france-visa, uk-visa and so on) are **insurance products for visa applicants** and are Travl's best-performing pages. They stay.

This is not a ride or transfer brand: there is no transfer or limo booking domain here. Brand config: `packages/shared/config/src/brands/travl.js`. It has no `features` block (those flags were removed repo-wide), so don't look for one to decide what Travl sells.

## What's mounted (`src/routes/index.js`)

The composition root wires these, and the set is brand-specific, so don't assume a domain exists just because another brand mounts it:

`auth`, `admin-users`, `admin-badges`, `blogs` (+ `blog-tags`), `flights`, `airports`, `locations`, `itineraries`, `insurance`, `tickets`, `pricing`, `affiliates`, `payments`, `assistant`.

**`currencies` is not mounted here.** An earlier version of this file said it was.

Travl-specific wiring worth knowing:
- **Blog is AI-assisted:** `createBlogRouter` receives `anthropicApiKey` — the blog content-generation/improve endpoints call Claude. (Marketing output must follow the house style in the root CLAUDE.md / memory.)
- **Flights use SerpApi (Google Flights) + AirLabs:** `createSerpApiClient` (flight search) alongside `createAirLabsClient` (airport/location data). Amadeus was removed.
- **Itineraries render as PDF in pure Node** (@react-pdf + pdf-to-img/canvas) — do **not** reintroduce Puppeteer or any headless browser.
- **Stripe webhook** success handlers here settle *ticket*, *itinerary* and *payment-link* purchases. Insurance is **not** on the Stripe rail at all: WIS takes the payment on its own hosted page and `confirmDirectPayInsurance` issues the policy. Respect idempotency on the Stripe side: a resent event must never deliver an itinerary or ticket twice, or charge twice.
- **Conversion tracking** is wired per action: `createGoogleAdsConversions` from `backend-app/tracking`, split into an insurance action and a tickets action, plus `createMetaCapi`.
- `registerAffiliateModels({ db })` runs at the top of the file, before anything that references an affiliate. Keep it there.

## The app shell

`src/app.js` is one `createApp()` call into `@travel-suite/backend-app`, which owns helmet, cors, compression, cookie-parser, the JSON parser, the rate limit, the raw-body webhook mount and the error handler. There is no Travl-specific middleware chain to preserve.

In particular, this backend has **no `express-mongo-sanitize` and no `hpp`**. An earlier version of this file claimed both as "extra hardening" and told you to keep them; they were unused dependencies and are gone. Don't add them back on the strength of that claim.

## Run it

```bash
pnpm turbo dev --filter=travl-backend...     # app + workspace deps in watch
# or from apps/travl-backend:
pnpm dev                                      # node --env-file=.env.development --watch
```

There is no seed-admin script. `scripts/` holds only `harvest-airline-logos.mjs`.
