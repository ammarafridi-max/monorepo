# CLAUDE.md — visawadi-backend

Scoped guidance for the **VisaWadi** backend. Read the repo-root `CLAUDE.md` first — the monorepo conventions (domain factory pattern, DI, `getOrRegisterModel`, Stripe-webhook-before-`express.json()`, "How to work in this repo") all apply here and are not repeated.

## What VisaWadi is

VisaWadi (AED, `Asia/Dubai`) is a **visa-only** brand: visa application support for UAE residents. Nothing else.

It does **not** sell travel insurance, travel itineraries, dummy/verifiable flight tickets, hotel reservations, or transfers. Those belong to other brands in this monorepo. If a task seems to call for one of them here, that is a signal the task belongs in a different app.

Note the distinction that matters most in this codebase: a **travel insurance policy** and a **day-by-day itinerary** are documents an applicant must supply as part of a visa file, and they appear throughout the visa checklists and requirement sections. That is not the same thing as VisaWadi selling those products. Keep the document references; never add a product surface for them.

## What's mounted (`src/routes/index.js`)

The composition root wires these domains — the set is brand-specific, so don't assume a domain exists just because another brand mounts it:

`auth`, `admin-users`, `blogs` (+ `blog-tags`), `visas`, `visa-leads`, `visa-applications`, `visa-requirements`, `payments`, `users`, `openai-ads`, `openai-events` (a local router in `src/routes/openaiEvents.js`), `assistant`.

**`currencies` is not mounted.** An earlier version of this file listed it.

Deliberately **not** mounted, and their packages are not dependencies: `insurance` (which also owns the `Nationality` model), `itineraries`, `flights`/`airports`/`locations` (and the `airlabs` + `serpapi` clients that fed them), `tickets`, `currencies`, the booking domains, `affiliates`.

The leftover airline logos under `src/public/airlines/` are gone, along with the `/airlines` static mount. Nothing to clean up there any more.

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
```

There is **no `scripts/` directory** in this app. The seed-admin, seed-visas and
seed-schengen-checklist commands that an earlier version of this file listed do
not exist; that data goes in directly against the database.

Secrets live only in Fly.io secrets. Never echo an `.env` file, print a Mongo URI or a `sk_`/`whsec_` key, or hardcode one in a `fly.*.toml`.
