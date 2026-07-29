# TRAVL SYSTEM MAP

A read-only audit of the `travel-suite` monorepo, produced to inform a new Schengen visa-assistance product. Every claim cites a file path. "None found" means it does not exist; "unclear" means it was checked but could not be confirmed (with what was checked). This document describes **what exists today** and proposes nothing.

Method: parallel read-only exploration of the whole repo, plus direct file verification of the highest-stakes claims (customer upload, customer auth, users mount, insurance payment rail, webhook mounting). No application code was read-modified; the only write is this file.

Scope note: the monorepo hosts **six brands**. This map covers all of them at the structure/URL level, but goes deep on **Travl** (`apps/travl-frontend`, `apps/travl-backend`) because that is where the visa product will live. Many domains are shared packages; a domain existing in `packages/` does **not** mean Travl mounts it — Travl's active surface is defined by `apps/travl-backend/src/routes/index.js`.

---

## 1. REPO STRUCTURE

pnpm + Turborepo monorepo (`package.json` name `travel-suite`). ESM, Node 22, pnpm 9.15.0 (`package.json` `packageManager`, `.nvmrc`). Workspaces: `apps/*`, `packages/*`, `packages/domains/*`, `packages/integrations/*`, `packages/shared/*` (`pnpm-workspace.yaml`). Turbo tasks: `build`, `dev`, `lint`, `test`, `clean` (`turbo.json`); root scripts run `turbo run <task>` (`package.json`).

### Apps (each brand = Next.js frontend + Express/Mongoose backend)

| App | Purpose | File |
|---|---|---|
| `apps/travl-frontend` | Travl storefront: visas, travel itinerary, travel insurance, blog, admin | `apps/travl-frontend/package.json` |
| `apps/travl-backend` | Travl API (largest surface: insurance, itineraries, visas, visa-leads, blog, payments, email-support, users) | `apps/travl-backend/src/routes/index.js` |
| `apps/dt365-{frontend,backend}` | DummyTicket365: dummy flight tickets | `apps/dt365-backend/src/routes/index.js` |
| `apps/mdt-{frontend,backend}` | MyDummyTicket: dummy tickets + insurance | `apps/mdt-backend/src/routes/index.js` |
| `apps/airportrides-{frontend,backend}` | Airport transfers/bookings | `apps/airportrides-backend/src/routes/index.js` |
| `apps/emirateslimo-{frontend,backend}` | Limo booking + zone pricing | `apps/emirateslimo-backend/src/routes/index.js` |
| `apps/travelshield-{frontend,backend}` | Travel insurance; **only app with customer login (NextAuth)** | `apps/travelshield-frontend/src/app/api/auth/[...nextauth]/route.js` |

Backends run `node --env-file=.env.<env> src/server.js` (`apps/*/package.json`). Frontends run `next dev/build/start` (`apps/*/package.json`).

### Packages

- **`packages/shared/config`** (`@travel-suite/config`) — per-brand config registry, `getBrand(key)` validated at load (`packages/shared/config/src/index.js`, `src/schema.js`, `src/brands/*.js`). Note: `src/brands/airportrides.js` exists but is **not registered** in `src/index.js` (`getBrand('airportrides')` would throw) — flagged.
- **`packages/shared/utils`** (`@travel-suite/utils`) — dates, currency, errors (`AppError`, `catchAsync`), logger, iata, itinerary helpers (`packages/shared/utils/src/index.js`).
- **`packages/shared/notifications`** (`@travel-suite/notifications`) — Brevo email templates + `createNotificationsService` (`packages/shared/notifications/src/index.js`, `src/templates/*`).
- **`packages/domains/*`** — self-contained factories (`schema→service→controller→router`, stitched by `index.js`). Present: `admin-users, affiliates, auth, availability-rules, blog, bookings, currencies, email-support, flights, insurance, itineraries, limo-bookings, locations, payments, pricing-rules, tickets, users, vehicles, visa, visa-leads, zones` (dir listing under `packages/domains/`). Peer-deps `express`/`mongoose`.
- **`packages/integrations/*`** — thin API clients: `airlabs, brevo, cloudinary, paypal, serpapi, transferz, wis` (dir listing under `packages/integrations/`).
- **`packages/frontend-shared`** (`@travel-suite/frontend-shared`) — the shared React layer consumed by all frontends (see §14).

### Dependency direction
Apps → domains/integrations/shared packages via `@travel-suite/*` workspace deps (per-app `package.json`). Domains never import a DB connection or env directly; the app "composition root" (`apps/<brand>-backend/src/routes/index.js`) injects `db`, `stripe`, `auth`, `notifications`, etc. Frontends consume `frontend-shared` via versioned subpath exports (`packages/frontend-shared/package.json`).

### Deploy (Fly.io)
10 configs at repo root, region `fra`, `shared-cpu-1x` (travl-backend 1024mb, others 512mb). Deploy: `flyctl deploy -c fly.<name>.toml`.

| Fly app | → dir | Dockerfile | port | file |
|---|---|---|---|---|
| `travl-frontend` | apps/travl-frontend | apps/travl-frontend/Dockerfile | 3000 | `fly.travl-frontend.toml` |
| `travl-backend` | apps/travl-backend | apps/travl-backend/Dockerfile | 3001 | `fly.travl-backend.toml` |
| `dt365-{frontend,backend}` | apps/dt365-* | apps/dt365-*/Dockerfile | 3000/3001 | `fly.dt365-*.toml` |
| `mdt-{frontend,backend}` | apps/mdt-* | apps/mdt-*/Dockerfile | 3000/3001 | `fly.mdt-*.toml` |
| `airportrides-{frontend,backend}` | apps/airportrides-* | ... | 3000/3001 | `fly.airportrides-*.toml` |
| `emirateslimo-{frontend,backend}` | apps/emirateslimo-* | ... | 3000/3001 | `fly.emirateslimo-*.toml` |
| `travelshield-{frontend,backend}` | apps/travelshield-* | **none found** | — | **no `fly.travelshield-*.toml`, no Dockerfile** |

**Build commands:** frontends build via `pnpm --filter <app> build` inside a multi-stage Dockerfile that copies `.env.build`→`.env.production` (bakes `NEXT_PUBLIC_*`) then emits Next standalone (`apps/*/Dockerfile`). Backends: alpine/slim image, `pnpm install --frozen-lockfile`, `CMD ["node","src/server.js"]` (`apps/*-backend/Dockerfile`; travl-backend uses `node:22-slim` + fonts/ca-certificates for PDF rendering). Frontend runtime `proxy.js` deploy is via `fly deploy` (working-tree build).

---

## 2. URL INVENTORY

### Table A — travl-frontend pages (`apps/travl-frontend/src/app`)

All `/admin/**` are ADMIN (client guard `AdminShell` + backend `restrictTo`). Travl has **no customer-gated routes** and **no `/api/*` route handlers** (verified: no `app/api` dir).

| URL | file | class |
|---|---|---|
| `/` | `page.js` | public |
| `/travel-itinerary` | `travel-itinerary/page.js` | public |
| `/travel-insurance` | `travel-insurance/page.js` | public |
| `/travel-insurance/{schengen-visa, france-visa, germany-visa, spain-visa, italy-visa, greece-visa, switzerland-visa, netherlands-visa, austria-visa, uk-visa, us-visa, canada-visa, australia-visa, annual-multi-trip, single-trip, medical, international}` | `travel-insurance/<slug>/page.js` | public |
| `/insurance-booking/{quote,passengers,review,payment}` | `insurance-booking/<step>/page.js` | public (funnel; `review/layout.js` = noindex) |
| `/itinerary-booking/form` | `itinerary-booking/form/page.js` | public |
| `/itinerary-booking/[sessionId]` and `/[sessionId]/success` | `itinerary-booking/[sessionId]/**` | public (dynamic, session-based) |
| `/visa` | `visa/page.js` | public |
| `/visa/[slug]` | `visa/[slug]/page.js` | public (dynamic) |
| `/blog`, `/blog/[slug]`, `/blog/tags`, `/blog/tags/[slug]` | `blog/**` | public (dynamic) |
| `/about`, `/contact`, `/faq`, `/claims`, `/privacy-policy`, `/terms-and-conditions` | `<page>/page.js` | public |
| `/admin/login` | `admin/login/page.js` | public (sign-in) |
| `/admin` | `admin/(dashboard)/page.js` | admin |
| `/admin/insurance-applications` + `/[sessionId]` | `admin/(dashboard)/insurance-applications/**` | admin |
| `/admin/itineraries` + `/[sessionId]` | `admin/(dashboard)/itineraries/**` | admin |
| `/admin/visa-leads` + `/[id]` | `admin/(dashboard)/visa-leads/**` | admin |
| `/admin/emails` | `admin/(dashboard)/emails/page.js` | admin |
| `/admin/blog` + `/new` + `/[id]/edit` | `admin/(dashboard)/blog/**` | admin |
| `/admin/blog-tags` | `admin/(dashboard)/blog-tags/page.js` | admin |
| `/admin/visa` + `/new` + `/[id]/edit` | `admin/(dashboard)/visa/**` | admin |
| `/admin/revenue` | `admin/(dashboard)/revenue/page.js` | admin |
| `/admin/payment-links` + `/[id]` | `admin/(dashboard)/payment-links/**` | admin |
| `/admin/products`, `/admin/pricing`, `/admin/currencies`, `/admin/users`, `/admin/account` | `admin/(dashboard)/<x>/page.js` | admin |
| `/sitemap.xml`, `/robots.txt` | `sitemap.js`, `robots.js` | public generated |

**Middleware / redirects (`apps/travl-frontend/src/proxy.js`, matcher `/((?!_next|api|.*\..*).*)`):**
- 301 `/blog/how-to-apply-...-guide-2` → `.../guide`; 301 `/blog/...-explained-2` → `...-explained`; 301 `/flight-itinerary` → `/travel-itinerary`; 301 `/blog/why-you-need-travel-insurance-...` → `/blog/why-travel-insurance-is-mandatory-...`; 308 `/blog/tag/*` → `/blog/tags/*`; 308 apex `travl.ae` → `www.travl.ae`.
- `apps/travl-frontend/next.config.mjs`: no redirects/rewrites (images + transpile only).

**Other frontends (route lists):** airportrides (`/transfer-booking/*` funnel, `/admin/bookings`, `/admin/affiliates`), dt365 (many `/dummy-ticket-*` + `/flight-itinerary` + `/booking/*`, `/admin/dummy-tickets`), mdt (dummy-ticket + `/travel-insurance/*` + both funnels), emirateslimo (route groups `(main)`/`(booking)`, `/book/*`, `/admin/zones|vehicles|pricing-rules|availability-rules`), travelshield (**only app with `/login`, gated `/account`, and `/api/auth/[...nextauth]` + `/api/auth/oauth-token`**). Each frontend has its own `proxy.js` (apex→www + `/blog/tag`→`/blog/tags`), except emirateslimo (redirect in `next.config.mjs`) and travelshield (none). Sources: `apps/<brand>-frontend/src/app/**`, `apps/<brand>-frontend/src/proxy.js`.

### Table B — travl-backend API endpoints

`/api` prefix from `app.use('/api', indexRouter)` (`apps/travl-backend/src/app.js:50`). Mounts in `apps/travl-backend/src/routes/index.js`. Two auth systems: admin `protect`/`restrictTo` (cookie `jwt`) and customer `protect` (cookie `userJwt`) — see §4.

| Method | Path | Auth | Router file |
|---|---|---|---|
| POST | `/api/webhook` | public (Stripe sig) — **mounted before `express.json`, raw body** | `apps/travl-backend/src/app.js:34`; handler `packages/domains/payments/src/webhook.js` |
| GET | `/health` | public | `apps/travl-backend/src/app.js:47` |
| POST | `/api/auth/login` | public | `packages/domains/auth/src/router.js:34` |
| POST/GET | `/api/auth/logout` | public | `auth/src/router.js:35-36` |
| GET/PATCH | `/api/auth/me` | admin `protect` | `auth/src/router.js:38-39` |
| PATCH | `/api/auth/update-password` | admin `protect` | `auth/src/router.js:40` |
| GET/PATCH | `/api/admin-users/me` (+`/me/password`) | admin `protect` | `packages/domains/admin-users/src/router.js:25-27` |
| GET/POST/GET/PATCH/DELETE | `/api/admin-users/` and `/:username` (+`/password`) | `restrictTo('admin')` | `admin-users/src/router.js:32-46` |
| GET | `/api/insurance/` , `/summary` | `restrictTo('admin','agent')` | `packages/domains/insurance/src/router.js:11-12` |
| POST | `/api/insurance/quote`, `/create`, `/finalize`, `/confirm-payment/:sessionId` | **public** | `insurance/src/router.js:13-20` |
| GET | `/api/insurance/nationalities`, `/download/:policyId/:index`, `/documents/:policyId` | public | `insurance/src/router.js:17-19` |
| GET/PATCH/DELETE | `/api/insurance/:sessionId` | `restrictTo('admin','agent')` / delete `('admin')` | `insurance/src/router.js:22-25` |
| GET | `/api/blogs/`, `/slug/:slug` | public | `packages/domains/blog/src/router.js:10-11` |
| POST/GET/PATCH/DELETE | `/api/blogs/*` (generate-cover, improve-content, admin/list, CRUD, publish, duplicate) | `restrictTo('admin','blog-manager')` | `blog/src/router.js:13-23` |
| GET | `/api/blog-tags/`, `/slug/:slug`, `/:id` | public | `blog/src/blogTag.router.js:19-21` |
| POST/PATCH/DELETE | `/api/blog-tags/*` | `restrictTo('admin','blog-manager')` | `blog/src/blogTag.router.js:23-28` |
| GET | `/api/visas/`, `/slug/:slug` | public | `packages/domains/visa/src/router.js:11-12` |
| GET/POST/PATCH/DELETE | `/api/visas/*` (admin/list, CRUD, publish, unpublish, duplicate) | `restrictTo('admin')` | `visa/src/router.js:15-24` |
| GET | `/api/currencies/`, `/:code` | public | `packages/domains/currencies/src/router.js:19-20` |
| POST/PUT/DELETE | `/api/currencies/*` | `restrictTo('admin','agent')` | `currencies/src/router.js:21-23` |
| POST | `/api/flights/` | public | `packages/domains/flights/src/router.js:7` |
| POST | `/api/flights/airlines/:airlineCode` | `restrictTo('admin')` | `flights/src/router.js:8` |
| GET | `/api/airports/` | public | `flights/src/router.js:15` |
| GET | `/api/locations/*` (cities, coordinates, distance, user-location) | public | `packages/domains/locations/src/router.js:6-10` |
| POST | `/api/visa-leads/` | public (rate-limited 5/hr) | `packages/domains/visa-leads/src/router.js:41` |
| GET/PATCH/POST/DELETE | `/api/visa-leads/*` (admin/list, `:id`, status, assign, notes) | `restrictTo('admin')` | `visa-leads/src/router.js:43-50` |
| GET | `/api/itineraries/` | `restrictTo('admin','agent')` | `packages/domains/itineraries/src/router.js:19` |
| POST | `/api/itineraries/` (multipart, ≤5×10MB), `/parse-documents`, `/:sessionId/regenerate\|edit\|chat`, `/:sessionId/checkout` | **public** (rate-limited) | `itineraries/src/router.js:24-42` |
| GET | `/api/itineraries/:sessionId`, `/preview`, `/chat`, `/document` | public | `itineraries/src/router.js:28-43` |
| GET/DELETE | `/api/itineraries/:sessionId/detail`, `DELETE /:sessionId` | `restrictTo('admin','agent')` / `('admin')` | `itineraries/src/router.js:34,37` |
| GET/POST/PATCH/DELETE | `/api/payments/admin/*` (revenue, charges, payment-links, products) | `restrictTo('admin'\|'agent')` | `packages/domains/payments/src/router.js:11-36` |
| GET/PATCH/POST | `/api/email-support/*` (list, draft, send, skip) | `restrictTo('admin','agent')` | `packages/domains/email-support/src/router.js:7-12` |
| POST | `/api/users/{register,login,logout,forgot-password,reset-password/:token}`, GET `/verify-email/:token` | public (customer) | `packages/domains/users/src/router.js:7-12` |
| GET/PATCH/DELETE | `/api/users/me` (+`/me/password`) | **customer** `protect` (userJwt) | `users/src/router.js:14-18` |

**Mount map** (`apps/travl-backend/src/routes/index.js`): `/auth`(47), `/admin-users`(49), `/insurance`(51), `/blogs`(69), `/blog-tags`(70), `/visas`(79), `/currencies`(80), `/flights`(84), `/airports`(85), `/locations`(86), `/visa-leads`(103), `/itineraries`(145), `/payments`(149), `/email-support`(183), `/users`(206). Static: `/airlines` (`app.js:44`).

**Other backends** all compose the same shared domain routers, differing by which they include: airportrides adds `bookings`; dt365/mdt add `tickets`+`affiliates`; emirateslimo adds `vehicles/zones/pricing-rules/availability-rules/limo-bookings`; travelshield is insurance-only. **Only travl-backend mounts `visas`, `visa-leads`, `itineraries`, `email-support`** (`apps/<brand>-backend/src/routes/index.js`).

### URL prefixes already TAKEN (unsafe to reuse) — travl-frontend
`/` · `/travel-itinerary` · `/travel-insurance` (+ all `*-visa` children) · `/insurance-booking` · `/itinerary-booking` · `/visa` · `/visa/[slug]` · `/blog` · `/claims` · `/contact` · `/about` · `/faq` · `/privacy-policy` · `/terms-and-conditions` · `/admin` · `/sitemap.xml` · `/robots.txt` · `/flight-itinerary` (301 source only). Backend API prefixes taken: `/api/{auth,admin-users,insurance,blogs,blog-tags,visas,currencies,flights,airports,locations,visa-leads,itineraries,payments,email-support,users,webhook}` (`routes/index.js`).

**Notably, `/visa` and `/api/visas` and `/api/visa-leads` are already occupied** — `/visa/*` is marketing/landing content + a lead CRM, not a customer application system (see §3, §15).

---

## 3. DATABASE

**ORM/driver: Mongoose 9 / MongoDB.** `"mongoose": "^9.0.2"` (`apps/travl-backend/package.json`); every schema does `new mongoose.Schema(...)` (e.g. `packages/domains/auth/src/schema.js`). Connection: `apps/travl-backend/src/utils/db.js` (a mongoose `Connection` injected as `db`). No Prisma/Sequelize/pg.

**Migrations: none found.** No migration dependency or `migrations/` dir. Schema is code-defined; Mongo creates collections on first write. Only seed/patch scripts exist: `apps/travl-backend/scripts/seed-admin.js`, `apps/travl-backend/src/scripts/seedVisas.js`, `.../patchSchengenTestimonials.js`.

**Model registration:** an idempotent `getOrRegisterModel(conn, name, schema)` (try `conn.model(name)`, else register) is duplicated in each domain `index.js` (e.g. `packages/domains/auth/src/index.js:9-15`). Travl wires auth first (returns `AdminUser`) and threads `auth`+models downstream (`apps/travl-backend/src/routes/index.js:39,49`); no explicit "ORDER CRITICAL" pre-registration block in Travl (that exists in dt365/mdt for `Vehicle`/`Zone`).

### Models Travl actively registers

| Collection/model | Schema file | Key fields (types) / refs |
|---|---|---|
| `admin-user` | `packages/domains/auth/src/schema.js` | name, username(unique), email(unique), password(bcrypt, select:false), role enum(`admin`/`agent`/`blog-manager`), status enum, passwordChangedAt |
| `User` (customer) | `packages/domains/users/src/schemas/user.schema.js` | firstName, lastName, email(unique), password(bcrypt 12, select:false), isVerified, isActive, passwordReset*, emailVerify* |
| `Blog` | `packages/domains/blog/src/schemas/blog.schema.js` | title, slug(unique), content, coverImageUrl, status enum, **author/publisher → ref `admin-user`**, tags[], faqs[], meta*, publishedAt, scheduledAt |
| `blog-tag` | `packages/domains/blog/src/schemas/blogTag.schema.js` | name, slug(unique), description, meta* |
| `Visa` | `packages/domains/visa/src/schemas/visa.schema.js` | **marketing page content**: countryName, slug(unique), status enum(`draft`/`published`), hero*, qualifierItems, packages[], processSteps[], requirementSections[], pricingBreakdown[], whyUs[], testimonials[], faqs[]. No refs. |
| `VisaLead` | `packages/domains/visa-leads/src/schemas/visaLead.schema.js` | **prospect CRM**: firstName, lastName, nationality, email, phone, packageRequested, applicantCount, visaSlug, source enum, status enum(`new`/`contacted`/`qualified`/`converted`/`lost`), **assignedTo → ref `admin-user`**, notes[], activityLog[], ipAddress/userAgent |
| `itinerary-order` | `packages/domains/itineraries/src/schemas/itinerary-order.schema.js` | **customer order**: sessionId(uuid, unique), input{traveller,segments[],reservations}, itineraryData(AI), previewUrl/cleanPdfUrl/**supportingDocuments[]**, status enum, paymentStatus enum(`UNPAID`/`PAID`/`REFUNDED`), price(49 AED), transactionId, paidAt, ipAddress. **No ref to `User`** |
| `insurance-application` | `packages/domains/insurance/src/schemas/InsuranceApplicationSchema.js` | **customer application**: sessionId(uuid, unique), **affiliate → ref `Affiliate`**, journeyType, dates, region, passengers[], email/address/mobile, policyId/policyNumber/supplier, paymentStatus enum, issuanceStatus enum, paymentSyncToken(select:false) |
| `Nationality` | `packages/domains/insurance/src/schemas/NationalitySchema.js` | insurance nationality list |
| `Affiliate` | `packages/domains/insurance/src/schemas/AffiliateSchema.js` | name, email(unique), affiliateId(9-digit), commissionPercent |
| `Currency` | `packages/domains/currencies/src/schema.js` | code(unique), name, symbol, rate, isBaseCurrency |
| `airline` | `packages/domains/flights/src/schemas/airline.schema.js` | iataCode, icaoCode, names, logo |
| `payment-link` | `packages/domains/payments/src/schemas/payment-link.schema.js` | stripePaymentLinkId(unique), amount, status enum, lineItems[]→ref `Product`, **createdBy → ref `admin-user`** |
| `Product` | `packages/domains/payments/src/schemas/product.schema.js` | name, unitAmount, stripePriceId(unique), **createdBy → ref `admin-user`** |
| `stripe-webhook-event` | `packages/domains/payments/src/schemas/webhook-event.schema.js` | eventId(unique), type, productType, handlerSucceeded, processingAt (idempotency lock) |
| `support-email` | `packages/domains/email-support/src/schema.js` | gmailMessageId(unique), from, subject, bodyText, status enum(`pending`/`sent`/`skipped`), draft |

### Flagged names (relevant to a visa product)
- **application** → `insurance-application` only (an insurance policy purchase). No generic/visa application entity.
- **customer/user** → `User` = customer accounts (exists in DB & backend); `admin-user` = staff.
- **document** → **no `Document` model.** PDFs/uploads are Cloudinary URLs stored on `itinerary-order` (`cleanPdfUrl`, `supportingDocuments[]`). No per-customer document collection, no access control model.
- **booking** → **no `Booking` model in Travl** (ride-brand only). Closest are `itinerary-order` + `insurance-application`.
- **order** → `itinerary-order`. **payment** → `payment-link`/`Product`/`stripe-webhook-event`. **lead** → `VisaLead`.

---

## 4. AUTHENTICATION

Two independent systems, separate secrets/cookies/models.

**ADMIN (staff) — fully wired end-to-end.** Domain `packages/domains/auth/*`. JWT `{ id, role, type:'admin' }` signed with `JWT_SECRET` (`packages/domains/auth/src/jwt.js:8-9`); cookie **`jwt`** (`httpOnly`, `sameSite` none in prod, `secure` in prod) (`jwt.js:13-22`). `protect` reads `req.cookies.jwt`, requires `type==='admin'`, loads `admin-user`, rejects `INACTIVE`, and invalidates tokens issued before `passwordChangedAt` (`packages/domains/auth/src/middleware.js:9-43`). `restrictTo(...roles)` → 403 (`middleware.js:45-50`). Passwords bcryptjs(12) in `schema.pre('save')` (`packages/domains/auth/src/schema.js:63-71`). Roles: `admin`, `agent`, `blog-manager`.

**CUSTOMER (end-user) — backend exists, but INACTIVE in the Travl frontend.** Domain `packages/domains/users/*`, mounted at `/users` (`apps/travl-backend/src/routes/index.js:196-206`, verified). JWT `{ id }` (no role/type) with `USER_JWT_SECRET`; cookie **`userJwt`** (also accepts `Authorization: Bearer`) (`packages/domains/users/src/{service.js:6-7,controller.js:2-9,middleware.js:8-12}`). Routes: register/login/logout/verify-email/forgot-password/reset-password + protected `/me` (`packages/domains/users/src/router.js`). Passwords bcryptjs(12); reset tokens SHA-256, 10-min expiry (`user.schema.js:34-46`). **No customer session-invalidation / no `restrictTo`.**

**Frontend reality (verified):** Travl uses a hardcoded **`GuestAuthProvider`** (`GUEST_AUTH = { user:null, isAuthenticated:false }`) in `apps/travl-frontend/src/app/Providers.js:132-135,169`. There is **no `/login`, `/register`, or `/account` route** in `apps/travl-frontend/src/app` (verified — no such dirs). No next-auth in Travl (`apps/travl-frontend/package.json`). Booking flows are anonymous/session-based (`sessionId`), never tied to a `User`. So: **no working customer login exists in Travl today** — only the backend building blocks. (Password-reset email is additionally a no-op in Travl — see §10.)

The only app with live customer login is **travelshield** (NextAuth Google/Facebook, gated `/account`) — `apps/travelshield-frontend/src/app/api/auth/[...nextauth]/route.js`, `apps/travelshield-frontend/src/app/account/layout.js`.

---

## 5. ADMIN PANEL

**Exists**, at `/admin` in `apps/travl-frontend`. Login `apps/travl-frontend/src/app/admin/login/page.js`; dashboard route group `apps/travl-frontend/src/app/admin/(dashboard)/`.

Manages: Insurance applications, Itineraries, Visa Leads (order/lead queues); Email Support; Blog, Blog Tags, Visa Pages (content); Revenue, Payment Links, Products, Pricing, Currencies (finance); Admin Users; My Account (nav in `apps/travl-frontend/src/app/admin/(dashboard)/layout.js`).

**Protection (three layers):** (1) client guard — `AdminShell` (`packages/frontend-shared/src/components/admin/v1/AdminShell.js:56-78`) redirects unauthenticated to `/admin/login`, enforces per-route role rules (`ROLE_ROUTE_RULES`, lines 14-31); hydrates via `AdminAuthContext` → `GET /api/admin-users/me`. (2) **No Next middleware** guards `/admin` — guard is client-side + backend. `robots: noindex` (`layout.js`). (3) backend `restrictTo` on every admin API (e.g. `packages/domains/visa/src/router.js:15`, `visa-leads/src/router.js:43`). Note leftover: `AdminShell` default path for `agent` = `/admin/dummy-tickets`, a route absent in Travl (`AdminShell.js:10`) — harmless shared-component残留.

---

## 6. EXISTING PRODUCT FLOWS

### Dummy flight tickets — NOT SOLD by Travl
`tickets` domain not mounted (`apps/travl-backend/src/routes/index.js`); backend brandContext states "Travl does not sell flight reservation documents (dummy tickets)…" (`routes/index.js:173`). No ticket page/form in `apps/travl-frontend/src`. Dummy tickets are **referred OUT** to `https://www.dummyticket365.com` from the insurance-booking cross-sell card (`apps/travl-frontend/src/app/insurance-booking/payment/page.js:23-33`). **Stale config to flag:** `packages/shared/config/src/brands/travl.js` still sets `features.dummyTickets:true` and SEO copy naming dummy tickets/hotels, and `apps/travl-frontend/CLAUDE.md` claims Travl sells dummy tickets — both contradict the mounted code.

### Dummy hotel reservations — NOT OFFERED
`features.hotelVouchers:false` (`packages/shared/config/src/brands/travl.js`); excluded in brandContext (`routes/index.js:173`); no hotel page/link. The itinerary form's `reservations.hotel` flag only tailors AI copy (`itinerary-order.schema.js`).

### Travel insurance (AXA via WIS) — automatic, **NOT Stripe**
- Entry: `travel-insurance/*` landing pages → funnel `insurance-booking/{quote,passengers,review,payment}` (thin wrappers over `frontend-shared` pages).
- Fields: journeyType, dates, region, quantity; per-passenger title/name/dob/nationality/passport; lead email/mobile/address (`packages/domains/insurance/src/service.js:25-83`).
- API: `POST /api/insurance/quote|create|finalize`, `POST /api/insurance/confirm-payment/:sessionId` (all public) (`packages/domains/insurance/src/router.js`).
- DB: `insurance-application` (UNPAID → PENDING → PAID/ISSUED) (`insurance/src/service.js`).
- **Payment: WIS "directpay" hosted page, not Stripe** — `finalize` returns `paymentUrl`; browser redirects (`packages/integrations/wis/src/index.js:57-60`; `packages/frontend-shared/src/components/ui/v1/ReviewSummary.js:279-284`). AXA is the underwriter (`wis/src/index.js:48-54`).
- Fulfilment: automatic on WIS return — `confirmDirectPayInsurance` issues policy + emails (`insurance/src/service.js:194-356`). **MANUAL STEP (exception path):** stuck issuance stays `PENDING_CONFIRMATION` with no auto-reconcile — resolved by customer retry or human support; admin can override via `PATCH /api/insurance/:sessionId`.
- Delivery: WIS emails the policy; Travl also emails confirmation; success page lists PDFs via `GET /api/insurance/documents/:policyId`.

### AI travel itinerary generator — fully automatic
- Entry: `travel-itinerary/page.js` → `itinerary-booking/form` → `itinerary-booking/[sessionId]` (`ItineraryGeneratorPage`, `packages/frontend-shared/src/pages/client/shared/ItineraryGeneratorPage.js`).
- Fields: traveller name/email/phone, visaCountry, fromCountry, purpose, travellers, segments[], flight/hotel reservation status, **optional supporting-document uploads** (`packages/domains/itineraries/src/service.js:78-113`).
- API: `POST /api/itineraries` (create, multipart), `/parse-documents`, poll `GET /:sessionId`, `/preview`, free `/regenerate`(≤2) + `/chat`(≤10), `POST /:sessionId/checkout` (Stripe), `GET /:sessionId/document` (paid-gated) (`packages/domains/itineraries/src/router.js`).
- DB: `itinerary-order`. Generation: Claude `claude-sonnet-4-6` (`packages/domains/itineraries/src/claude.js`) → validated → rendered to PDF pure-Node (`packages/domains/itineraries/src/pdf.js`) → Cloudinary.
- **Payment: Stripe Checkout Session** (AED 49) (`itineraries/src/service.js:558-592`). On webhook success → clean PDF rendered + emailed. **MANUAL STEP: none** in happy path.
- Delivery: emailed PDF (`apps/travl-backend/src/notifications/itinerary.js`) + gated download.

---

## 7. LEAD COLLECTION

- **Visa leads (structured, primary):** from `/visa` + `/visa/[slug]` (`VisaDetailPage` → `LeadFormModal`, `packages/frontend-shared/src/components/forms/v1/LeadFormModal.js`), CTAs tagged `source` ∈ `hero_cta`/`package_card`/`final_cta`. Fields: firstName, lastName, nationality, email, phone(E.164), packageRequested, applicantCount, visaSlug (`packages/domains/visa-leads/src/service.js:27-72`). Endpoint `POST /api/visa-leads` (public, 5/hr) → `VisaLead` model. After capture: admin email (`notificationsService.sendVisaLeadToAdmin`, template `packages/shared/notifications/src/templates/visa-lead.js`) + admin CRM (`/admin/visa-leads`, status/assign/notes). **MANUAL STEP: yes** — leads are a human sales queue; nothing auto-fulfilled.
- **Contact / claims (unstructured):** `contact/page.js` and `claims/page.js` are `mailto:info@travl.ae` + WhatsApp only, no DB write, no form; insurance claims are entirely manual ("no online portal", `claims/page.js:19-38`).
- **Inbound email:** the `email-support` domain (AI-drafted replies via Gmail) handles inbound mail (`routes/index.js:175-183`) — not a lead form.

---

## 8. PAYMENTS (Stripe)

- Client: `createStripeClient` (`packages/domains/payments/src/client.js`), instantiated at `apps/travl-backend/src/routes/index.js:105` from `STRIPE_SECRET_KEY`.
- Products/prices: no single price map. Itinerary uses ad-hoc `price_data` default **AED 49** (`packages/domains/itineraries/src/service.js:176`). Admin catalog creates real Stripe Products+Prices persisted as `Product`/`payment-link` (`packages/domains/payments/src/service.js:68,316`).
- Checkout: **Checkout Sessions** (itinerary + generic) and **Payment Links** (admin ad-hoc). No raw PaymentIntents. **Insurance does not use Stripe** (WIS directpay).
- Webhook: `POST /api/webhook`, `express.raw()` **before** `express.json()` (`apps/travl-backend/src/app.js:34`); handler `packages/domains/payments/src/webhook.js`. Verifies signature, idempotent via `stripe-webhook-event` claim lock (`webhook.js:42-120`). Dispatches on `metadata.productType`: `itinerary` (mark PAID + render/email PDF) and `payment-link` (mark paid + admin email). **No `insurance` webhook.**
- Orders marked paid: `itinerary-order.paymentStatus='PAID'` (`itineraries/service.js:604-611`); `payment-link.status='paid'`; insurance PAID/ISSUED set in `confirmDirectPayInsurance` (non-Stripe).
- **Refunds: none found** in Travl-mounted code. `stripe.refunds.create` exists only in `tickets`/`limo-bookings` domains (not mounted in Travl). Admin analytics read refund amounts (`payments/service.js:614,662`) and enums include `REFUNDED`, but **all refunds are out-of-band (Stripe/WIS dashboards) — MANUAL**.

---

## 9. FILE HANDLING

- **Generation:** itinerary PDF + preview via `@react-pdf/renderer` + `pdf-to-img` + `@napi-rs/canvas` — **pure-Node, no Puppeteer/Chromium** (verified: `packages/domains/itineraries/src/pdf.js` header "Pure-Node rendering — NO headless browser"; deps in `packages/domains/itineraries/package.json`). `renderCleanPdf` (post-pay) / `renderPreviewImage` (watermarked PNG, pre-pay). No `puppeteer/pdfkit/sharp/playwright` in app source. No insurance/ticket PDF generated in Travl (insurance PDFs come from WIS).
- **Storage: Cloudinary** (`packages/integrations/cloudinary/src/index.js`, `createCloudinaryStorage`), folders `travl/blog`, `travl/visa`, `travl/travel-itineraries` (`apps/travl-backend/src/routes/index.js`). Only URLs persisted in Mongo (`itinerary-order.previewUrl/cleanPdfUrl/supportingDocuments[]`). **No local-disk persistence**; multer uses `memoryStorage()` everywhere.
- **CUSTOMER FILE UPLOAD — YES, one exists (verified).** The itinerary generator accepts anonymous customer uploads: `POST /api/itineraries` and `POST /api/itineraries/parse-documents` use `upload.array('documents', 5)` with **no `protect`** (`packages/domains/itineraries/src/router.js:24,31`; multer `memoryStorage`, 10MB/file, ≤5 files, `router.js:5`). Frontend `<input type="file" accept="application/pdf,image/*">` (`packages/frontend-shared/src/pages/client/shared/ItineraryGeneratorPage.js:442`). Files go to Claude for parsing and are archived in Cloudinary under `${sessionId}/supportingDocuments/`. Intended for flight/hotel docs; accepts any PDF/image ≤10MB. **This is anonymous/session-based, not tied to a logged-in customer, with no signed/expiring URLs.**
- **ADMIN uploads (distinct, auth-gated):** blog cover (`packages/domains/blog/src/router.js`, `restrictTo('admin','blog-manager')`), visa hero image (`packages/domains/visa/src/router.js`, `restrictTo('admin')`). No customer upload in insurance/visa-leads/users routers (verified — no multer).
- **Limits/retention/serving:** itinerary uploads 10MB×5; blog/visa admin uploads have no explicit size cap. Cloudinary `saveFile` uses deterministic `public_id` + `overwrite:true` (no orphans). Cleanup on admin itinerary delete via `storage.deleteSubfolder(sessionId)`; **no time-based retention policy.** Serving via Cloudinary `secure_url` (public-but-unguessable, **no signed URLs**); clean PDF gated at app layer (`GET /:sessionId/document` returns 402 if unpaid).

---

## 10. EMAIL

- **Service: Brevo (Sendinblue) HTTP API** via raw `fetch` (no nodemailer). Send: `apps/travl-backend/src/utils/email.js` → `POST https://api.brevo.com/v3/smtp/email`, key `BREVO_API_KEY`, sender `Travl <ADMIN_EMAIL>`; supports base64 attachments. Contacts: `apps/travl-backend/src/utils/brevo.js`. Package client also exists: `packages/integrations/brevo/src/index.js`.
- **Templates:** shared HTML renderers `packages/shared/notifications/src/templates/*` (insurance-payment, payment-link-paid, visa-lead, ticket/booking variants); Travl-local inline templates `apps/travl-backend/src/notifications/{itinerary,insurance}.js`.
- **Emails sent + triggers:** itinerary-ready PDF → customer (Stripe itinerary webhook); insurance payment received → admin; payment-link paid → admin (Stripe payment-link webhook); visa lead → admin (lead submit); email-support AI draft (Gmail poll). (`apps/travl-backend/src/notifications/*`, `packages/shared/notifications/src/index.js`, wiring in `routes/index.js`.)
- **Gap:** customer **password-reset email is a no-op** in Travl — `users` service calls `notifications?.sendPasswordReset(...)` only if defined, and Travl's notifications service does not implement it (`packages/domains/users/src/service.js`; `apps/travl-backend/src/routes/index.js` notifications wiring). Email-verification email similarly unclear/likely unwired. No customer-facing transactional emails are configured in Travl beyond the itinerary receipt.

---

## 11. AI USAGE

All Anthropic calls use **`claude-sonnet-4-6`**, key `ANTHROPIC_API_KEY`.

| Where | Purpose | Prompt (summary) | Output |
|---|---|---|---|
| `packages/domains/itineraries/src/claude.js` `generate()` | Day-by-day itinerary as strict JSON | "embassy-ready itinerary writer"; use only given cities/dates; never invent flights/hotels/prices | validated → PDF → Cloudinary + `itinerary-order` |
| same `chat()` | Conversational itinerary edit | "itinerary editor"; returns `{updatedInput,itinerary,reply}` | re-rendered order |
| same `parseDocuments()` | Extract flight segments from **customer-uploaded** PDFs/images | "extract travel details…resolve codes…never invent" | prefill form; files archived Cloudinary |
| `packages/domains/blog/src/controller.js:350` `improveContent` | Rewrite blog HTML to sound human | "professional editor…no em dashes…forbidden words…British English" (raw `fetch api.anthropic.com`) | back to admin editor |
| `packages/domains/email-support/src/drafter.js` `draftReply` | Classify + draft support reply | "friendly support agent…never say fake, never promise refunds" | `support-email.draft` |
| `scripts/generate-blog-draft.mjs:204` | Daily blog generation | large SEO/GEO Travl system prompt; JSON post | POST `/api/blogs` status `published` |
| `scripts/expand-blog-post.mjs` | Blog expansion utility (unclear exact use — not fully read) | — | likely blog API |

- **Recraft image gen** (`RECRAFT_API_KEY`): blog cover images — `packages/domains/blog/src/controller.js:301` (`recraftv3`, realistic, 1820×1024) and `scripts/generate-blog-draft.mjs:276` (picsum fallback).
- **Blog pipeline:** `scripts/topics.json` + `scripts/site-context.md` → `scripts/generate-blog-draft.mjs` (login as admin, Claude JSON, Recraft cover, POST `/api/blogs`) → GitHub Action `.github/workflows/travl-daily-blog-publish.yml` (**currently PAUSED** — cron commented out; manual dispatch only). Secrets: `ANTHROPIC_API_KEY`, `TRAVL_ADMIN_EMAIL`, `TRAVL_ADMIN_PASSWORD`, `RECRAFT_API_KEY`.

---

## 12. THIRD-PARTY SERVICES (Travl)

| Service | Purpose | Client / file | Key env var(s) |
|---|---|---|---|
| Stripe | Payments (itinerary, payment-links, webhooks) | `packages/domains/payments/*`; `routes/index.js:105` | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Anthropic (Claude) | Itinerary/chat/doc-parse, blog improve, email drafts | `@anthropic-ai/sdk` / raw fetch | `ANTHROPIC_API_KEY` |
| Recraft | AI cover images | raw fetch (blog) | `RECRAFT_API_KEY` |
| Cloudinary | Object storage (images, PDFs, customer docs) | `packages/integrations/cloudinary` | `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` |
| Brevo | Transactional email + contacts | `apps/travl-backend/src/utils/{email,brevo}.js` | `BREVO_API_KEY` |
| WIS (AXA) | Insurance quotes/policies | `packages/integrations/wis`; `apps/travl-backend/src/utils/wis.js` | `WIS_URL`, `WIS_AGENCY_ID`, `WIS_AGENCY_CODE` |
| AirLabs | Airport/airline lookup | `packages/integrations/airlabs` | `AIRLABS_API_KEY` |
| SerpApi | Google Flights search | `packages/integrations/serpapi` | `SERPAPI_API_KEY` |
| Gmail API | Email-support poll/draft | `packages/domains/email-support` | `GMAIL_CLIENT_ID/SECRET/REFRESH_TOKEN/USER` |
| MongoDB | Datastore | `apps/travl-backend/src/utils/db.js` | `MONGO_URI` |
| GA4 / Hotjar / TinyMCE | analytics / heatmaps / admin editor | `frontend-shared` shared components | `NEXT_PUBLIC_GA4_MEASUREMENT_ID`, `NEXT_PUBLIC_HOTJAR_ID`, `NEXT_PUBLIC_TINYMCE_API_KEY` |
| circle-flags CDN | flag SVGs (mega menu) | `packages/frontend-shared/src/components/sections/v2/Navbar.js` | none |

**In repo but NOT wired into Travl:** PayPal (`packages/integrations/paypal`), Transferz (`packages/integrations/transferz`), Amadeus (env `AMADEUS_API_KEY/SECRET_KEY` present in travl-backend `.env` but usage unclear — not confirmed in `routes/index.js`).

---

## 13. ENVIRONMENT VARIABLES (names only; no values printed)

**travl-backend** (`apps/travl-backend/.env.*`, `src/utils/config.js`): `NODE_ENV`, `PORT`, `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_COOKIE_EXPIRES_IN`, `USER_JWT_SECRET`, `USER_JWT_EXPIRES_IN`, `USER_COOKIE_EXPIRES_IN`, `CORS_ORIGINS`/`FRONTEND_URL`, `ADMIN_EMAIL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `BREVO_API_KEY`, `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET`, `ANTHROPIC_API_KEY`, `RECRAFT_API_KEY`, `WIS_URL/AGENCY_ID/AGENCY_CODE`, `AIRLABS_API_KEY`, `SERPAPI_API_KEY`, `AMADEUS_API_KEY/SECRET_KEY`, `GMAIL_CLIENT_ID/CLIENT_SECRET/REFRESH_TOKEN/USER`, `TRAVL_ADMIN_EMAIL`, `TRAVL_ADMIN_PASSWORD`.

**travl-frontend** (`apps/travl-frontend/src/config.js`, `.env.build`): `NEXT_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_GA4_MEASUREMENT_ID`, `NEXT_PUBLIC_TINYMCE_API_KEY`, `NEXT_PUBLIC_HOTJAR_ID`, `NEXT_PUBLIC_BRAND` (brand select).

**Shared packages:** `NEXT_PUBLIC_BRAND`/`BRAND` (`packages/shared/config/src/index.js`); `NEXT_PUBLIC_BACKEND_URL` (`packages/frontend-shared/src/services/apiClient.js`); `RECRAFT_API_KEY` (`packages/domains/blog/src`).

**Other apps (names differ):** dt365/mdt add `SERPAPI_API_KEY`, `PAYPAL_CLIENT_ID/SECRET/MODE` (dt365), `BREVO_TICKET_LIST_ID`; airportrides/emirateslimo add `GOOGLE_MAPS_API_KEY`, `IPINFO_API_KEY`; emirateslimo adds `OPENAI_API_KEY`, `GOOGLE_SERVICE_ACCOUNT_JSON`, `PRICING_SHEET_ID/TAB`; travelshield adds `NEXTAUTH_SECRET`, `NEXT_PUBLIC_AUTH_URL/SECRET`, `FACEBOOK_ID/SECRET`, `GOOGLE_ID/SECRET`. Sources: `apps/<brand>-*/.env.*`, `apps/<brand>-*/src/config.js`. **No secret values were read out.**

---

## 14. SHARED CODE (reusable for new features)

`packages/frontend-shared` (`@travel-suite/frontend-shared`, versioned subpath exports in its `package.json`):
- **Components** (`src/components/{ui,forms,form-elements,cards,sections,admin,shared}/{v1,v2}`) — incl. admin scaffolding: `AdminShell.js`, `AdminDashboardLayout`, admin CRUD forms (`BlogForm`, `VisaForm`), dashboard widgets.
- **Hooks** (`src/hooks/*`) — React-Query hooks per domain (auth, blog, visa, visa-leads, insurance, itineraries, payments, currencies, account, contact, …).
- **Contexts** (`src/contexts/*`) — `AdminAuthContext.js`, `UserAuthContext`/`AuthContextBase.js`, `CurrencyContext`, `InsuranceContext`.
- **Services** (`src/services/*`) — `apiClient.js` (`apiFetch`/`apiFetchPublic`, credentials-include, reads `NEXT_PUBLIC_BACKEND_URL`) + typed clients per domain (`apiAuth`, `apiVisa`, `apiVisaLeads`, `apiInsurance`, `apiItineraries`, `apiBlog`, `apiPayments`, …).
- **Layouts / pages / utils** — `AppMegaLayout`, `InsuranceLayout`, `ItineraryLayout`; `src/pages/{client,admin}/*` full compositions; `src/utils/{schema,dates,currency,analytics,breadcrumb}.js`.

Backend-reusable: **auth middleware** `protect`/`restrictTo` (`packages/domains/auth`); **customer auth** (`packages/domains/users`); **model helper** `getOrRegisterModel` (per-domain `index.js`); **payments** factory incl. Stripe client + webhook (`packages/domains/payments`); **notifications** (`packages/shared/notifications`); **utils** `AppError`/`catchAsync` (`packages/shared/utils`); **integration clients** (`packages/integrations/*`). Domain factory pattern (`schema→service→controller→router`) is the template for any new domain.

---

## 15. GAPS FOR A VISA PRODUCT

Target: customers **log in**, **upload passport scans and bank statements**, and **staff review** those documents. Against today's code, here is what does **not** exist. Biggest missing pieces first.

1. **A logged-in customer experience — effectively absent in Travl.** The `users` domain (register/login/JWT `userJwt`/reset) exists in the backend and is mounted (`apps/travl-backend/src/routes/index.js:206`), but the Travl **frontend is hardcoded guest** (`apps/travl-frontend/src/app/Providers.js:132-135`) with **no `/login`, `/register`, or `/account` routes** (verified). Also, customer **password-reset and email-verification emails are not wired** in Travl (§10). So: customer login UI, account area, session wiring, and the transactional emails to support it all need building/activating. (travelshield has a working customer-auth pattern to copy — `apps/travelshield-frontend`.)

2. **No "visa application" entity.** `Visa` is marketing-page content and `VisaLead` is a prospect CRM (`packages/domains/visa/…`, `packages/domains/visa-leads/…`) — neither models a customer's application (case) with a status lifecycle, assigned reviewer, and attached documents. There is no case/application record linking `User → documents → review state`. `insurance-application`/`itinerary-order` are the closest patterns but are anonymous (sessionId, no `User` ref).

3. **No customer document-upload system fit for sensitive PII.** A customer upload capability *does* exist (itinerary supporting docs — `packages/domains/itineraries/src/router.js:24,31`), but it is **anonymous, not tied to a `User`, unvalidated beyond size, stored in Cloudinary with public-but-unguessable URLs (no signed/expiring URLs), and has no retention policy** (§9). For passports and bank statements you would need: authenticated upload bound to a customer/application, a **`Document` model/collection** (none exists), access-controlled/private storage with signed URLs, file-type/AV validation, and retention/PII handling. None of that exists today.

4. **No staff document-review workflow.** Admin has queues for insurance applications, itineraries, and a visa-lead CRM, but **no per-document review UI** (view uploaded passport/statement, approve/reject/request-resubmission, per-document status, audit trail). The `VisaLead` notes/activityLog pattern (`packages/domains/visa-leads/src/schemas/visaLead.schema.js`) is the closest reusable idea but operates on leads, not documents.

5. **No customer-facing dashboard/gated routes.** Travl has zero gated customer routes (only PUBLIC + ADMIN). A "track my application / upload more documents / see reviewer feedback" area does not exist.

6. **No payment path for a visa service.** Visa is currently lead-gen only (consultation via `mailto`/`LeadFormModal`); there is no checkout for visa. Stripe infrastructure (Checkout Sessions, Payment Links, webhook, idempotency) exists and is reusable (`packages/domains/payments`, §8), but no visa product/price or webhook `productType` is defined.

7. **No secure document delivery/notification loop.** No signed URLs, no "your document was approved/rejected" customer emails, no secure-message channel between staff and customer (email-support is inbound Gmail triage, not per-application messaging).

8. **Operational/compliance gaps for PII at rest.** In-memory multer + public Cloudinary URLs + no retention/deletion policy + no encryption-at-rest guarantees documented (§9) are inadequate for passport/bank-statement handling; there is no existing pattern in the repo for private, access-scoped document storage.

**What is reusable (so the gap is build-on-top, not greenfield):** the domain factory pattern; `packages/domains/users` (customer auth) + the travelshield NextAuth precedent; `packages/domains/payments` (Stripe); Cloudinary integration (would need private/signed configuration); admin scaffolding (`AdminShell`, admin forms) for a review UI; `getOrRegisterModel` + Mongoose for new `application`/`document` models; `@travel-suite/notifications` for emails; `restrictTo` for role-gated review access.

**Naming/URL collisions to avoid** (already taken, §2): `/visa`, `/visa/[slug]`, `/api/visas`, `/api/visa-leads`, and the `Visa`/`VisaLead` model names are in use for the marketing+lead system — a customer-application system needs distinct routes/collections (e.g. not `/visa`, not `Visa`/`VisaLead`).

---

*End of map. Read-only audit; no application code was modified. Uncertain items are marked "unclear" above (notably: Amadeus env usage, `expand-blog-post.mjs` exact use, and whether customer email-verification is wired).*
