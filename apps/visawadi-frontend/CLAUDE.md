# CLAUDE.md — visawadi-frontend

Scoped guidance for the **VisaWadi** frontend. Read the repo-root `CLAUDE.md` first — the monorepo conventions (Next.js App Router, `frontend-shared` subpath exports, brand config, house style for copy) apply here and are not repeated.

## What VisaWadi is

VisaWadi is a **visa-only** brand for UAE residents: visa application support and nothing else.

It does **not** sell travel insurance, travel itineraries, dummy/verifiable flight tickets, hotel reservations or transfers. Don't build UI for any of them, and don't import shared components or services belonging to those domains — the backend does not mount them, so the calls would 404.

One distinction to keep straight: a **travel insurance policy** and a **day-by-day itinerary** are documents an applicant supplies as part of a visa file, and they appear in checklists and requirement lists. That is not the same as VisaWadi selling those products.

The one intentional outbound reference is **Dummy Ticket 365** for proof of onward travel. We don't sell it, applicants need it, so `src/config/blogOffers.js` links out to `dummyticket365.com` on onward-travel posts. That is a deliberate exception to the brand-neutrality rule and it belongs in app config, never in `frontend-shared`.

## Domain

`https://www.visawadi.com` (frontend) and `https://api.visawadi.com` (backend). **`.com`, not `.ae`** — an earlier pass used `.ae` throughout and it was wrong. If you see a `visawadi.ae` string anywhere, it's a leftover.

## Route map (`src/app`)

Public:
- **`/`** — visa-led homepage.
- **`/visa`, `/visa/[slug]`** — the visa listing and detail pages (ISR, `revalidate = 300`).
- **`/blog`, `/blog/[slug]`, `/blog/tags`, `/blog/tags/[slug]`** — blog.
- **`/about`, `/contact`, `/faq`, `/privacy-policy`, `/terms-and-conditions`** — hand-written, not shared components.
- **`/apply`, `/apply/login`, `/apply/[applicationRef]`** — the customer document-upload flow. `noindex`. There is no public entry point: an admin creates the application and the backend emails a magic link. **The reminder cron already sends `/apply/...` URLs, so these routes must stay reachable.**

Admin:
- **`admin/login`**, and **`admin/(dashboard)`** — Dashboard, Visa Leads, Visa Applications, Document Registry, Blog, Blog Tags, Visa Pages, Revenue, Payment Links, Products, Currencies, Admin Users, My Account.

The sidebar nav and brand mark are configured in `src/app/admin/(dashboard)/layout.js`.

`src/config.js` reads the `NEXT_PUBLIC_*` env vars. `src/proxy.js` is the middleware and currently only redirects apex to www; add legacy-path redirects there as they appear.

## Conventions specific to this app

- Data fetching goes through `@travel-suite/frontend-shared/services/*` against `NEXT_PUBLIC_BACKEND_URL`. Don't hand-roll fetches to the backend.
- Admin pages are thin re-exports of shared `pages/admin/*` components. Keep them that way; put real changes in the shared component so every brand benefits.
- The dashboard uses `AdminVisaDashboardPage` — brand-neutral, reads only the visa and blog domains. Do not switch it to `AdminTravlDashboardPage`, which fetches insurance data and links to routes that do not exist here.
- Contact details live in `src/config/contact.js` and nowhere else. `ADDRESS`, `GMB_URL` and `SOCIALS` are still null/empty, so the footer address block and social row don't render yet.
- Nationalities come from `frontend-shared/data/nationalities.js`, a static list. Do **not** switch back to `useGetNationalities` — that hits the insurance domain, which this backend does not mount, and it silently produces an unsubmittable form.
- Copy follows the house style (conversational, no em dashes, GEO-structured, natural CTA) and **names only VisaWadi**.

## Known gaps

- The legal pages (`/privacy-policy`, `/terms-and-conditions`) were adapted from another brand and name "VisaWadi" as a trading name, not a registered legal entity. They need a lawyer's review before launch.
- `public/logo.webp` and `favicon.png` are still the other brand's files.
- No `og-image.png`, though page metadata references one.
- `packages/shared/config/src/brands/` has no `visawadi.js`. Nothing calls `getBrand` here yet, but it would throw if anything started to.

