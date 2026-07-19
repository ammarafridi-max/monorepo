# airportrides-frontend

The customer-facing web app for **airportrides.com** — a worldwide airport-transfer booking platform. It's a Next.js 15 (App Router) + React 19 + Tailwind v4 app that serves the marketing site, the multi-step transfer-booking funnel, and the admin dashboard. Data comes from `airportrides-backend` over `NEXT_PUBLIC_BACKEND_URL`.

It is one of six brand frontends in the `travel-suite` monorepo. Most components, hooks, contexts, services, and admin pages live in `@travel-suite/frontend-shared`; this app supplies the airportrides-specific pages, sections, theme, and copy.

---

## TL;DR for someone new

- **Entry:** [src/app/layout.js](src/app/layout.js) (fonts, root metadata) → [src/app/Providers.js](src/app/Providers.js) (client providers) → route.
- **Home page:** [src/app/page.js](src/app/page.js) composes the sections in [src/sections/](src/sections/).
- **The booking funnel:** [src/app/transfer-booking/](src/app/transfer-booking/) — `select-vehicle → details → review → payment`, state held in the shared `TransferBookingContext`.
- **Shared code:** anything imported from `@travel-suite/frontend-shared/...` lives in `packages/frontend-shared`. Local UI lives in [src/components/](src/components/) and [src/sections/](src/sections/).
- **Config:** [src/config.js](src/config.js) reads `NEXT_PUBLIC_*` env vars. Public build-time vars are committed in `.env.build`.
- **No test suite. Linting** is `next lint` only.

---

## Running locally

```bash
# from the monorepo root
pnpm install

# from apps/airportrides-frontend
pnpm dev     # next dev   → http://localhost:3000
pnpm build   # next build (standalone output)
pnpm start   # next start
pnpm lint    # next lint
```

---

## Environment variables

Read in [src/config.js](src/config.js). All are `NEXT_PUBLIC_*` (client-exposed). Build-time public values are committed in [.env.build](.env.build) and copied to `.env.production` inside the Docker build.

| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | Base URL of airportrides-backend. All API calls target it. |
| `NEXT_PUBLIC_SITE_URL` | Public site URL for metadata, canonicals, sitemap, robots (default `https://airportrides.com`). |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | GA4 measurement ID. Blank → analytics is skipped. |
| `NEXT_PUBLIC_META_PIXEL_ID` | Meta Pixel ID (plumbed through config; default empty). |
| `NEXT_PUBLIC_BRAND` | Brand key for `@travel-suite/config` (`airportrides`). |
| `NEXT_PUBLIC_TINYMCE_API_KEY` | Rich-text editor key for the admin blog editor. |

---

## Project structure

```
src/
├── app/                      # App Router
│   ├── layout.js             # fonts, root <html>, root metadata, cloudinary preconnect
│   ├── Providers.js          # client providers (Query, contexts, Navbar/Footer, analytics)
│   ├── globals.css           # Tailwind v4 theme + base styles
│   ├── page.js               # home page (server component)
│   ├── robots.js / sitemap.js# SEO route handlers
│   ├── error.js / loading.js / not-found.js
│   ├── about, contact, faq, blog, privacy-policy, terms-and-conditions/
│   ├── transfer-booking/     # the booking funnel
│   └── admin/                # login + (dashboard) route group
├── components/               # local UI (Navbar, Footer, BookingForm, pickers, LocationInput)
├── sections/                 # local home/marketing page sections
├── lib/schema.js             # JSON-LD builders wired to airportrides identity
├── config.js                 # NEXT_PUBLIC_* env → constants
└── proxy.js                  # middleware (apex→www + legacy redirects)
```

### Providers — [src/app/Providers.js](src/app/Providers.js)

A client component that branches on route:

- **Admin routes (`/admin/*`)** get a stripped tree: just `Toaster` (react-hot-toast) + `QueryClientProvider`. No Navbar/Footer, no currency/booking contexts, **no analytics**.
- **Public routes** get the full tree: `AnalyticsInit`, `Toaster`, TanStack Query, then nested contexts (`CurrencyProvider`, `TicketProvider`, `InsuranceProvider`, `TransferBookingProvider`) wrapping `Navbar` / `main` / `Footer`.

TanStack Query defaults to a 5-minute `staleTime`.

---

## Styling

Tailwind **v4**, configured entirely in [src/app/globals.css](src/app/globals.css) (no `tailwind.config.js`):

- `@import 'tailwindcss'` plus three `@source` globs pointing at `packages/frontend-shared` (`components`, `pages`, `layouts`) so classes used by shared code are scanned. PostCSS via `@tailwindcss/postcss`.
- **`@theme inline`** defines the design tokens as CSS variables that Tailwind turns into utilities:
  - **`sand-50…500`** — warm neutral backgrounds (body is `sand-100`).
  - **`ink` / `ink-soft` / `ink-mute`** — navy text scale.
  - **`clay-50…900`** — the blue brand color; **`primary-*` is aliased to `clay-*`**.
  - **`honey-300…600`** — secondary accent.
  - Custom type sizes (`eyebrow`, `lead`, `h2`, `display`), radii (`card`, `panel`, `pill`), and warm shadows (`shadow-warm`, `shadow-warm-sm`).
- **Fonts** (wired in [layout.js](src/app/layout.js) via `next/font/google`): **Plus Jakarta Sans** → `--font-display` (headings), **Hanken Grotesk** → `--font-body`/`--font-sans` (body).
- Base layer: smooth scroll, antialiased body, headings in Jakarta with tight `-0.02em` tracking, a `.grain` noise overlay, a `.reveal` entrance animation (respects `prefers-reduced-motion`), and `.blog_post` prose styles for rendered blog HTML.

> Note the two visual registers: the marketing/booking site uses the **sand/ink/clay** warm theme; the admin dashboard pages mostly use plain gray/`primary-*` utilities.

---

## SEO

SEO is handled per-page with Next's Metadata API plus hand-written JSON-LD — there is no global metadata helper in use here.

- **Root metadata** ([layout.js](src/app/layout.js)) — `metadataBase` from `SITE_URL`, default title/description, favicon, and Open Graph (`/og-image.png`). Individual pages override it.
- **Marketing pages** (`about`, `faq`, `blog`, `privacy-policy`, `terms-and-conditions`) are **server components** that export a plain `metadata` object with `title`, `description`, and `alternates.canonical`. `blog` adds Open Graph and `export const revalidate = 3600` (ISR). `contact` is a client component, so its metadata lives in a sibling `contact/layout.js`.
- **Home page** exports no metadata (inherits the root) and emits no JSON-LD.
- **Structured data (JSON-LD):**
  - `PageHero` (used by every marketing page) emits a **BreadcrumbList** via `buildBreadcrumbList` from `@travel-suite/frontend-shared/utils/breadcrumb`.
  - `/faq` injects a hand-built **FAQPage** schema inline.
- **[src/lib/schema.js](src/lib/schema.js)** wires the shared schema builders (`buildOrganization`, `buildWebsite`, `buildService`, …) to the airportrides identity (Dubai address, `info@airportrides.com`, 24/7 contact). It's ready for use but **currently not imported by any page** — reach for it when adding Organization/Service/Product schema.
- **[robots.js](src/app/robots.js)** — allows `/`, disallows `/admin` and `/api`, points at the sitemap.
- **[sitemap.js](src/app/sitemap.js)** — lists the static marketing pages with change frequencies/priorities. It's `async` and structured so airport-landing and blog URLs can be appended once those routes exist.
- **[proxy.js](src/proxy.js)** (Next middleware) — 308 redirects apex → `www` and legacy `/blog/tag/*` → `/blog/tags/*`.

**Copy style** across the site follows the house style: conversational, no em dashes, verdict-first, question-as-H2 with short answers, FAQ structure, and a natural CTA toward booking.

---

## Analytics

- **`AnalyticsInit`** (`@travel-suite/frontend-shared/components/shared/AnalyticsInit`) is rendered once in the public provider tree. It lazily calls `initializeGA()` from the shared `utils/analytics` via `requestIdleCallback` (fallback `setTimeout(1200ms)`), and **skips `/admin` entirely**.
- The shared **`utils/analytics`** module wraps **`react-ga4`**. `initializeGA()` only fires when `NODE_ENV === 'production'` **and** the path isn't `/admin`, so GA4 is inert in dev and on admin. The module also exports a large set of typed event helpers (`begin_checkout`, `select_item`, `purchase` with localStorage dedupe, etc.) shared across brands; airportrides currently relies on GA4 auto-pageview tracking after `initialize`.
- **Meta Pixel** ID flows through `config.js` (`NEXT_PUBLIC_META_PIXEL_ID`) for paid-social use; GA4 is the actively wired analytics.

> For GA4 + App Router, `ReactGA.initialize()` is sufficient — pageviews are auto-tracked, so there's no manual route-change wiring.

---

## The transfer-booking funnel

The core conversion flow. State is held in the shared **`TransferBookingContext`** (provided app-wide in `Providers.js`), which carries `pickup, dropoff, date, time, passengers, luggage`, `selectedVehicle`, `passengerDetails`, `bookingId`, plus a **page-action registry** (`registerPageAction` / `unregisterPageAction`). The shared `TransferBookingLayout` renders the stepper chrome and a Next button that invokes the current step's registered async action; returning `false` blocks advancing.

1. **Search (home hero).** [BookingForm](src/components/BookingForm.js) collects pickup/dropoff (`LocationInput`, backed by the backend `/locations` autocomplete), date, time, passengers, luggage — with past date/time guards — writes them into the context, and routes to `/transfer-booking/select-vehicle`.
2. **[select-vehicle](src/app/transfer-booking/select-vehicle/page.js).** Renders vehicle cards and sets `selectedVehicle`. The vehicle list is currently a hardcoded `PLACEHOLDER_VEHICLES` array (marked `TODO` to swap for the live supplier API — the card shape already mirrors a real supplier response).
3. **[details](src/app/transfer-booking/details/page.js).** Passenger form (name, country-code + phone, email, flight number, special requests) with local validation. On Next it saves `passengerDetails` and calls `createBookingApi({ trip, vehicle, passenger })` → creates a `pending_payment` booking, storing the returned `_id` as `bookingId`.
4. **[review](src/app/transfer-booking/review/page.js).** Read-only summary with Edit links. On Next it calls `createBookingCheckoutApi({ vehicle, passenger, bookingId, successUrl, cancelUrl })` and redirects the browser to the returned **Stripe Checkout** URL. `successUrl` is `/transfer-booking/payment?status=success&bookingId=…&sessionId={CHECKOUT_SESSION_ID}`.
5. **[payment](src/app/transfer-booking/payment/page.js).** The post-Stripe success page: reads `status`/`sessionId` from the query, fetches the booking via `getBookingBySessionIdApi`, and shows the booking ref (`AR-<bookingRef>`), a trip summary, and a "what happens next" panel.

Checkout is initiated server-side (the backend creates the session) — there's no client-side Stripe.js. The actual payment confirmation, status flip to `paid`, and confirmation emails happen on the backend via the Stripe webhook. All booking API calls go through `@travel-suite/frontend-shared/services/apiBookings`.

---

## Admin dashboard

Lives under `/admin`, isolated from the public providers and excluded from analytics and robots.

- **[admin/login](src/app/admin/login/page.js)** renders the shared `AdminLoginPage`; **[admin/not-found.js](src/app/admin/not-found.js)** re-exports the shared `AdminNotFound`.
- **[admin/(dashboard)/layout.js](src/app/admin/(dashboard)/layout.js)** wraps the shared `AdminDashboardLayout`, passing a role-aware `nav` config (Overview, Content, Finance, People, Settings — each item tagged with `roles` like `admin`/`agent`/`blog-manager` and a Lucide icon) and `robots: noindex`.
- **Dashboard pages** live in the `(dashboard)` route group: `bookings` (+ `[id]`), `blog` (+ `new`, `[id]/edit`), `blog-tags`, `currencies`, `payment-links` (+ `[id]`), `products`, `revenue`, `users`, `affiliates` (+ `[id]`), `account`.
- **Split of local vs. shared:** the **dashboard home** and **bookings list** are implemented locally (bespoke stat cards / tables calling `listBookingsApi`, with a `STATUS_CFG` map and `AR-######` refs). Most other pages are thin route files that re-export the corresponding component from `@travel-suite/frontend-shared/pages/admin/*`.

---

## Local components & sections

**[src/components/](src/components/)** — airportrides-specific UI:
- `Navbar` — sticky header with anchor nav and mobile menu.
- `Footer` — brand, link columns, payment-method icons (`react-icons`).
- `BookingForm` — the hero search form (see funnel step 1).
- `DatePicker` / `TimePicker` — fully custom themed popovers (no external date lib).
- `LocationInput` — autocomplete combobox using a shared suggestions hook (Google Places–style), with keyboard nav.

**[src/sections/](src/sections/)** — home/marketing sections, mostly server components that take content via props and share the frontend-shared `Container`:
- `HeroSection` (embeds `BookingForm`), `HowItWorksSection`, `WhyBookSection`, `DestinationsSection`, `TravelerTypesSection`, `TrustSection`, `FaqSection` (wraps shared `FaqAccordion`), `FinalCtaSection` (CTA + launch-notify email capture; posts to `/api/subscribe` via `subscribeToLaunchListApi`, with submitting/success/error states).
- `PageHero` — reusable page header that also emits BreadcrumbList JSON-LD.
- `SectionHeading` — the shared eyebrow/title/subtitle atom.

The home page ([page.js](src/app/page.js)) is a server component that defines all its copy inline (steps, value props, destinations, traveler types, trust pillars, FAQs) and passes it to these sections.

---

## Deployment

`Dockerfile` is a multi-stage build producing Next's **standalone** output (`output: "standalone"` in [next.config.mjs](next.config.mjs)):

1. **deps** — install workspace deps from the lockfile (layer-cached).
2. **builder** — copy `.env.build` → `.env.production` (public `NEXT_PUBLIC_*` only), `next build`, then fold `static/` and `public/` into the standalone tree.
3. **runner** — a slim `node:22-alpine` image running `node apps/airportrides-frontend/server.js` on port 3000.

`next.config.mjs` also allows Cloudinary remote images (AVIF/WebP) and transpiles `@travel-suite/frontend-shared`. Deployed to **Fly.io**; per-tier `fly.airportrides-*.toml` lives at the repo root.

---

## Conventions to respect

- **Brand neutrality:** never reference another brand by name. Brand-specific copy/theme belongs in this app or the brand config; keep frontend-shared defaults brand-neutral.
- **Match the shared component version already in use** (v1 vs v2) when editing a page.
- **Public secrets only:** the only values safe to commit (in `.env.build`) are `NEXT_PUBLIC_*` public keys.
- **House style for copy:** conversational, no em dashes, GEO-structured (verdict first, question-as-H2 + short answer, FAQ), with a natural CTA toward booking.
- **No test suite.** State plainly what you did and did not verify after a change.
```
</content>
