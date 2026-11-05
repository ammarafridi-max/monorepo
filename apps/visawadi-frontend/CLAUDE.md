# CLAUDE.md — visawadi-frontend

Scoped guidance for the **VisaWadi** frontend. Read the repo-root `CLAUDE.md` first — the monorepo conventions (Next.js App Router, `frontend-shared` subpath exports, brand config, house style for copy) apply here and are not repeated.

## What VisaWadi is

VisaWadi is a **visa-assistance** brand for UAE residents.

The Schengen-family packages (`schengen`, `france-visa`, `germany-visa`, `italy-visa`, `spain-visa`, `greece-visa`) **do include** a dummy flight reservation, a hotel reservation, 9 days of travel insurance and a day-by-day itinerary. This is deliberate: VisaWadi has owned supply for these at near-zero marginal cost, and it is the basis of the pricing position. Do not "correct" these out of `packages[].features` as a brand-neutrality or scope breach. They are the offer.

The UK, US and Canada packages are different: they offer **guidance** on the flight reservation, not the reservation itself. Their flight FAQ says the applicant arranges it separately, and that is accurate. Keep the two families distinct when editing copy.

What VisaWadi does **not** sell as a standalone product is transfers. There is also no self-serve checkout for insurance or itineraries: they exist only as components of a visa package, so don't build product UI for them or import shared components from those domains — the backend does not mount them, so the calls would 404.

### Who owns which product (blog content)

Two outbound references are deliberate. Both are exceptions to the brand-neutrality rule, both belong in app config or post content, never in `frontend-shared`:

| Brand | Product | Pricing | Linking |
|---|---|---|---|
| **VisaWadi** | visa assistance in the UAE, nothing else | | `/uae/visa/<slug>` |
| **Travl** | travel insurance, travel itineraries | insurance from AED 30 | insurance may be linked; **the itinerary must never be linked** |
| **Dummy Ticket 365** | flight reservations, aka flight itineraries, aka dummy tickets | USD 13 / 20 / 23 for 2 / 7 / 14 days validity, **never in dirhams** | `dummyticket365.com` |

`src/config/blogOffers.js` links out to `dummyticket365.com` on onward-travel posts.

The 35 posts migrated from Travl originally violated all of this: they sold Travl's insurance as VisaWadi's, quoted Dummy Ticket 365 in dirhams, and recommended a competitor. They were fixed on 2026-08-16; the rules above are the record of what was applied. Do not "correct" Travl links back out as a brand-neutrality breach: they are intentional.

## Domain

`https://www.visawadi.com` (frontend) and `https://api.visawadi.com` (backend). **`.com`, not `.ae`** — an earlier pass used `.ae` throughout and it was wrong. If you see a `visawadi.ae` string anywhere, it's a leftover.

## Route map (`src/app`)

Public:
- **`/`** — visa-led homepage.
- **`/[country]`, `/[country]/visa/[slug]`** — the visa listing and detail pages, segmented by residence country (ISR, `revalidate = 300`). Only `uae` is live. The legacy `/visa` and `/visa/[slug]` paths 308 to these from `next.config.mjs`; internal links must use the canonical country-prefixed form.
- **`/blog`, `/blog/[slug]`, `/blog/tags`, `/blog/tags/[slug]`** — blog.
- **`/about`, `/contact`, `/faq`, `/privacy-policy`, `/terms-and-conditions`** — hand-written, not shared components.
- **`/apply`, `/apply/login`, `/apply/[applicationRef]`** — the customer document-upload flow. `noindex`. There is no public entry point: an admin creates the application and the backend emails a magic link. **The reminder cron already sends `/apply/...` URLs, so these routes must stay reachable.**

Admin:
- **`admin/login`**, and **`admin/(dashboard)`**: Dashboard, Visa Leads, Visa Applications, Document Registry, Blog, Blog Tags, Visa Pages, Revenue, ChatGPT Ads, Payment Links, Products, Admin Users, Assistant, My Account.

**There is no Currencies entry and no `/admin/currencies` page here.** An earlier version of this file listed one. The nav in `layout.js` and the page directories are the authority; the backend doesn't mount `currencies` either.

The sidebar nav and brand mark are configured in `src/app/admin/(dashboard)/layout.js`.

There is **no `src/config.js`**; it was deleted. `NEXT_PUBLIC_*` vars are read where they are used, and `src/config/` (a directory) holds `blogOffers.js`, `contact.js`, `countries.js`, `homeNav.js` and `trust.js`.

**There is no middleware.** An earlier version of this file claimed a `src/proxy.js`; no such file exists and none is needed. Apex-to-www and the legacy `/visa/*` to `/uae/visa/*` redirects are `async redirects()` entries in `next.config.mjs`, which is also the right place to add new ones. That matters because Next silently ignores middleware under `output: 'standalone'`, which this app uses.

## Conventions specific to this app

- Data fetching goes through `@travel-suite/frontend-shared/services/*` against `NEXT_PUBLIC_BACKEND_URL`. Don't hand-roll fetches to the backend.
- Admin pages are thin re-exports of shared `pages/admin/*` components. Keep them that way; put real changes in the shared component so every brand benefits.
- The dashboard uses `AdminVisaDashboardPage` — brand-neutral, reads only the visa and blog domains. Do not switch it to `AdminInsuranceDashboardPage`, which fetches insurance data and links to routes that do not exist here.
- Contact details live in `src/config/contact.js` and nowhere else. `ADDRESS` and `GMB_URL` are still null, so the footer address block doesn't render yet. `SOCIALS` is populated (Facebook, Instagram, TikTok) and shows in the footer and on `/contact`.
- `public/logo.webp`, `favicon.png` and `og-image.png` are VisaWadi's own assets.
- Nationalities come from `frontend-shared/data/nationalities.js`, a static list. Do **not** switch back to `useGetNationalities` — that hits the insurance domain, which this backend does not mount, and it silently produces an unsubmittable form.
- Copy follows the house style (conversational, no em dashes, GEO-structured, natural CTA) and **names only VisaWadi**.

## Known gaps

- The legal pages (`/privacy-policy`, `/terms-and-conditions`) were adapted from another brand and name "VisaWadi" as a trading name, not a registered legal entity. They need a lawyer's review before launch.
(The old gap about a missing brand config is closed: `packages/shared/config/src/brands/visawadi.js` exists and is registered, and `layout.js`, `robots.js` and `lib/schema.js` all call `getBrand('visawadi')`.)

