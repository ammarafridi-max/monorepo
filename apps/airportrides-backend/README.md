# airportrides-backend

The API for **airportrides.com** — a worldwide airport-transfer booking platform. It's an Express 5 + Mongoose 9 (MongoDB) service that takes bookings, runs Stripe Checkout, processes payment webhooks idempotently, sends transactional email through Brevo, and powers the admin dashboard (bookings, blog, currencies, payment links, revenue, users).

It is one of six brand backends in the `travel-suite` monorepo. Almost none of the business logic lives here — this app is a **composition root**: it imports domain packages from `packages/`, wires them with airportrides-specific config, and mounts them under `/api`.

---

## TL;DR for someone new

- **Entry point:** [src/server.js](src/server.js) → connects Mongo, starts [src/app.js](src/app.js).
- **The map of the whole API:** [src/routes/index.js](src/routes/index.js). If you want to know what an endpoint does, start there.
- **Everything is dependency-injected.** Domain packages (`@travel-suite/bookings`, `@travel-suite/auth`, …) receive `db`, `stripe`, `notifications`, `auth`, `logger` as arguments. Nothing in a package reaches out for a connection or env var itself.
- **Secrets live only in Fly.io secrets / `.env.*` files.** Never print them, never commit them.
- **No test suite exists.** Don't claim tests pass.

---

## Running locally

```bash
# from the monorepo root
pnpm install

# from apps/airportrides-backend
pnpm dev     # node --env-file=.env.development --watch src/server.js  → http://localhost:4003
pnpm start   # node --env-file=.env.production  src/server.js
```

No `nodemon`, no `dotenv` — the app relies on Node 22's built-in `--watch` and `--env-file`. Health check: `GET /health` → `{ "status": "ok", "brand": "airportrides" }`.

Seed an admin user:

```bash
pnpm seed-admin:dev    # node --env-file=.env.development scripts/seed-admin.js
pnpm seed-admin:prod
```

---

## Environment variables

Loaded from `.env.development` / `.env.production` and read once in [src/utils/config.js](src/utils/config.js). Config is intentionally centralized — code reads `config.x`, never `process.env.x` directly.

| Var | Purpose |
|---|---|
| `NODE_ENV` | `development` toggles verbose error responses (stack traces) and throws on email failure. |
| `PORT` | HTTP port (default `4003`). |
| `MONGO_URI` | MongoDB connection string. |
| `CORS_ORIGINS` | Comma-separated allowed origins (default `http://localhost:3000`). |
| `FRONTEND_URL` | Public frontend base URL. |
| `JWT_SECRET` / `JWT_EXPIRES_IN` / `JWT_COOKIE_EXPIRES_IN` | Admin auth (default `7d` / 7 days). |
| `USER_JWT_SECRET` / `USER_JWT_EXPIRES_IN` / `USER_COOKIE_EXPIRES_IN` | Public customer accounts (defaults fall back to the admin secret; `30d` / 30 days). |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Stripe API + webhook signature verification. |
| `BREVO_API_KEY` | Brevo (Sendinblue) transactional email + contacts. |
| `ADMIN_EMAIL` | Notification recipient + email sender identity (default `info@airportrides.com`). |
| `GOOGLE_MAPS_API_KEY` | Location autocomplete / geocoding / distance (via `@travel-suite/locations`). |
| `IPINFO_API_KEY` | IP geolocation for currency/region defaults. |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Blog image storage/upload. |
| `AIRLABS_API_KEY` | Airport/flight lookup (`@travel-suite/airlabs`). |

> Secrets are radioactive. Don't echo `.env` files or hardcode keys anywhere.

---

## Architecture

### Composition root — [src/routes/index.js](src/routes/index.js)

This file *is* the API. It:

1. **Pre-registers Mongoose models in a specific order** (see the `ORDER CRITICAL` comment). Schemas referenced by other schemas must be registered first. `getOrRegisterModel(conn, name, schema)` is an idempotent helper — return the existing compiled model, or register it — so re-imports and hot-reload don't throw "model already exists."
2. **Instantiates each domain factory** with airportrides config and mounts its router under `/api/*`.
3. **Wires the `notifications` service** with the brand identity and theme (name, sender names, website, colors `#1e60a6` / `#ff603a`).
4. **Creates the Stripe client** and exports the **webhook handler** (`stripeWebhookHandler`) so `app.js` can mount it before the JSON body parser.

### Domain-package pattern

Every domain package exports a **factory**, not a live router. Internal shape is always `schema.js → service.js → controller.js → router.js`, stitched by the package's `index.js`. The factory returns `{ router, service, controller }` so the composition root can reuse the service/controller directly (e.g. call `bookingService` from the webhook handler).

```js
const { router, service, controller } = createBookingsRouter({ db, stripe });
router.use("/bookings", bookingsRouter);
```

Packages declare `mongoose`/`express` as `peerDependencies` and never import a DB connection, env, or client — they receive them as arguments.

### Request lifecycle — [src/app.js](src/app.js)

Middleware order matters here:

1. **Request context** — assigns `req.id` (`x-request-id` header or a fresh UUID), echoes it back, and logs every finished response (`method`, `url`, `status`, `ms`, `requestId`).
2. **Stripe webhook** — `POST /api/webhook` is mounted with `express.raw()` **before** `express.json()`, because Stripe signature verification needs the raw body. Do not move it behind the JSON parser.
3. **Security & parsing** — `helmet`, `cors` (credentials on, origins from config), `compression`, `cookie-parser`, `express.json({ limit: "10kb" })`.
4. **Rate limit** — `/api/*` capped at 500 requests / hour / IP.
5. **Static** — `/airlines/*` serves airline logos with a cross-origin resource policy header.
6. **Routes** — `GET /health` and `app.use("/api", indexRouter)`.
7. **404 + global error handler** — unknown routes become an operational `AppError(404)`. The error handler returns stack traces in development, the operational message in production, and a generic 500 (logged with `requestId`) for unexpected errors.

### Utilities — [src/utils/](src/utils/)

- **[config.js](src/utils/config.js)** — the single env → config map, with `parseList`/`parseNumber` helpers.
- **[db.js](src/utils/db.js)** — `connectDB()` + the shared `db` (`mongoose.connection`) injected into every factory.
- **[email.js](src/utils/email.js)** — low-level `sendEmail({ email, name, subject, htmlContent, textContent })` posting to the Brevo SMTP API. Skips (returns `false`) when `BREVO_API_KEY` is missing; throws in development, swallows-and-logs in production. This function is injected into `@travel-suite/notifications`.
- **[brevo.js](src/utils/brevo.js)** — Brevo *contacts* helpers (`createContact`, `subscribeContact`, `updateContactAttribute`) for marketing/CRM sync. `subscribeContact` backs the `/api/subscribe` launch-notify capture.

`logger`, `AppError`, and `catchAsync` come from `@travel-suite/utils`.

---

## API surface

Everything is mounted under `/api`. Highlights:

| Prefix | Package | What it does |
|---|---|---|
| `/api/auth` | `@travel-suite/auth` | Admin login/logout, `/me`, password update. Rate-limited login. Returns the `auth` middleware + `AdminUser` model for reuse. |
| `/api/admin-users` | `@travel-suite/admin-users` | Manage admin/agent/blog-manager accounts (protected). |
| `/api/blogs`, `/api/blog-tags` | `@travel-suite/blog` | Blog CRUD; images uploaded to Cloudinary (`airportrides/blog` folder). |
| `/api/currencies` | `@travel-suite/currencies` | Currency list + rates for pricing/display. |
| `/api/airports` | `@travel-suite/flights` + `@travel-suite/airlabs` | Airport search backed by the AirLabs client. |
| `/api/locations` | `@travel-suite/locations` | Google Maps autocomplete, coordinates, distance, IP geolocation. |
| `/api/bookings` | `@travel-suite/bookings` | Core transfer bookings (see below). |
| `/api/contact` | inline handler | Validates the contact form and emails it to the admin via `notifications.sendContactFormToAdmin`. |
| `/api/subscribe` | inline handler | Captures a "notify me at launch" email as a Brevo contact (`subscribeContact`, tagged `SOURCE: launch-notify`). |
| `/api/payments` | `@travel-suite/payments` | Admin revenue dashboard + custom Stripe payment links (protected). |
| `/api/users` | `@travel-suite/users` | Public-facing customer accounts (register, verify email, login, forgot/reset password, profile). Uses a separate JWT secret + 30-day cookie. |
| `/api/webhook` | `@travel-suite/payments` | Stripe webhook (mounted in `app.js`, raw body). |

---

## The booking + payment flow

This is the heart of the backend, and the part where correctness matters most.

**Bookings domain** ([packages/domains/bookings/src/](../../packages/domains/bookings/src/)):

- **Schema** — `trip` (pickup/dropoff with lat/lng, date, time, passengers, luggage), `vehicle` (name, class, price `{ amount, currency }`, features), `passenger` (name, email, phone, flight number, special requests), `status`, `bookingRef`, `stripeSessionId`, timestamps.
- **Status enum:** `pending_payment → paid → confirmed → completed` (or `cancelled`).
- **Routes:** `POST /` (create), `POST /checkout` (Stripe session), `GET /by-session/:sessionId`, `GET /:id`. The composition root also mounts `GET /bookings` (admin list, paginated + status filter) and `PATCH /bookings/:id/status`.

**End-to-end sequence:**

1. Frontend creates a `pending_payment` booking → `POST /api/bookings`.
2. Frontend requests checkout → `POST /api/bookings/checkout`. The service creates a Stripe Checkout session (`mode: payment`, card, `invoice_creation` on, `metadata.productType = "booking"`, `metadata.bookingId`), generates a 6-digit `bookingRef`, stores `stripeSessionId` on the booking, and returns the Stripe URL.
3. Customer pays on Stripe. Stripe redirects to the frontend success page **and** fires a `checkout.session.completed` webhook.
4. `POST /api/webhook` verifies the signature, then routes by `metadata.productType` to `handleBookingPaymentSuccess` (in `routes/index.js`): it flips the booking to `paid` and sends **two** emails via `@travel-suite/notifications` — an admin alert and a customer confirmation.

**Idempotency (critical).** Stripe retries and resends events. The webhook handler ([packages/domains/payments/src/webhook.js](../../packages/domains/payments/src/webhook.js)) records each `event.id` in a `stripe-webhook-event` collection with a `handlerSucceeded` flag:

- Duplicate of a **succeeded** event → short-circuits, no re-processing.
- Duplicate of a **failed** event (no success flag) → allowed to retry.
- Non-`paid` sessions and events without a matching handler are acknowledged but skipped.

So a resent webhook never double-issues a booking or double-sends emails. Preserve this guarantee for any new webhook handler.

---

## Notifications & email

[src/utils/email.js](src/utils/email.js) provides the transport (`sendEmail`) and is injected into `createNotificationsService` along with the brand identity. `@travel-suite/notifications` owns the HTML templates and exposes brand-neutral senders — the ones used here:

- `sendBookingPaymentToAdmin` / `sendBookingConfirmationToCustomer` — on paid booking.
- `sendPaymentLinkPaidToAdmin` — on a paid custom payment link.
- `sendContactFormToAdmin` — from the `/api/contact` route.

Email sends are best-effort: failures are logged (and warned about in the webhook handler) but never break the payment path. In development a send failure throws; in production it returns `false`.

---

## Deployment

`Dockerfile` is a two-stage pnpm build:

1. **deps** — copies `package.json` files for every workspace this app depends on + the root lockfile, then `pnpm install --frozen-lockfile` (layer-cached).
2. **runner** — copies `packages/` and this app, sets `NODE_ENV=production`, `PORT=3001`, and runs `node src/server.js`.

Deployed to **Fly.io**; per-tier config lives in `fly.airportrides-*.toml` at the repo root. Secrets are set with `fly secrets set`, never baked into the image or the TOML.

---

## Conventions to respect

- **Brand neutrality:** shared packages must never name another brand. Brand-specific strings (identity, theme, sender names, `AR-` ref prefix) belong here in `routes/index.js`, not in a package.
- **Keep the webhook before `express.json()`** and keep its idempotency intact.
- **Read config through `config.js`**, not `process.env`, so validation stays in one place.
- **New domains** follow the `schema → service → controller → router` factory shape and get wired in `routes/index.js` with injected deps.
- **There is no test suite.** When you finish a change, state plainly what you did and did not verify.
</content>
</invoke>
