# CLAUDE.md — visawadi-backend

Scoped guidance for the **VisaWadi** backend. Read the repo-root `CLAUDE.md` first — the monorepo conventions (domain factory pattern, DI, `getOrRegisterModel`, Stripe-webhook-before-`express.json()`, "How to work in this repo") all apply here and are not repeated.

## What VisaWadi is

VisaWadi (AED, `Asia/Dubai`) is a **visa-only** brand: visa application support for UAE residents. Nothing else.

It does **not** sell travel insurance, travel itineraries, dummy/verifiable flight tickets, hotel reservations, or transfers. Those belong to other brands in this monorepo. If a task seems to call for one of them here, that is a signal the task belongs in a different app.

Note the distinction that matters most in this codebase: a **travel insurance policy** and a **day-by-day itinerary** are documents an applicant must supply as part of a visa file, and they appear throughout the visa checklists and requirement sections. That is not the same thing as VisaWadi selling those products. Keep the document references; never add a product surface for them.

## What's mounted (`src/routes/index.js`)

The composition root wires these domains — the set is brand-specific, so don't assume a domain exists just because another brand mounts it:

`auth`, `admin-users`, `blog` (+ blog-tags), `visa`, `visa-leads`, `visa-applications`, `currencies`, `payments`, `users`.

Deliberately **not** mounted, and their packages are not dependencies: `insurance` (which also owns the `Nationality` model), `itineraries`, `flights`/`airports`/`locations` (and the `airlabs` + `serpapi` clients that fed them), `tickets`, `bookings`, `affiliates`.

The airline logos still bundled at `src/public/airlines/` and served from `/airlines` belong to the removed flights domain. They are harmless but unused; delete them if they are still there when you next touch this app.

VisaWadi-specific wiring worth knowing:

- **The visa application system is the core product.** `createVisaApplicationsRouter` takes both `auth` (admin) and `userAuth` (customer magic-link sessions). Private customer documents — passports, bank statements — go to a **separate authenticated Cloudinary space** (`visawadi/visa-applications`) and are always read back through signed, short-lived URLs. Never move those to an unsigned public folder.
- **Visa leads** capture prospects and notify through the `notifications` service.
- **Blog is AI-assisted:** `createBlogRouter` receives `anthropicApiKey`. Marketing output follows the house style in the root CLAUDE.md.
- **Stripe webhook** currently settles *payment-link* purchases only. Visa packages are sold through consultation rather than self-serve checkout. Any handler added here must be idempotent — Stripe resends events, and a duplicate must never double-charge or double-issue.
- **Reminder sweep:** `runVisaReminderSweep` is exported for `server.js` to schedule with node-cron at 09:00 Asia/Dubai, guarded by `ENABLE_REMINDER_CRON` so it runs on exactly one instance.

## Cloudinary folders

All uploads are namespaced under `visawadi/`: `visawadi/blog`, `visawadi/visa`, `visawadi/visa-applications`. Do not write into another brand's namespace.

## Environment

Runs on Node's built-in env-file loader and watcher, no nodemon or dotenv:

```bash
pnpm dev     # node --env-file=.env.development --watch src/server.js
pnpm start   # node --env-file=.env.production src/server.js

node --env-file=.env.development scripts/seed-admin.js            # seed an admin user
node --env-file=.env.development src/scripts/seedVisas.js         # seed visa landing pages
node --env-file=.env.development scripts/seed-schengen-checklist.mjs
```

Secrets live only in Fly.io secrets. Never echo an `.env` file, print a Mongo URI or a `sk_`/`whsec_` key, or hardcode one in a `fly.*.toml`.
