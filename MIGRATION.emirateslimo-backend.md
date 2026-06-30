# Migration: emirateslimo-backend → monorepo

Moving `emirateslimo/Website/emirateslimo-backend` (standalone monolith) into
`monorepo/apps/emirateslimo-backend` as a **thin shell over shared `@travel-suite/*`
packages**, matching the convention used by `airportrides-backend` / `dt365-backend`.

- **Scope:** backend only (frontend deferred to a later task).
- **Architecture:** refactor onto shared packages (not lift-and-shift).
- **Status:** planning complete; implementation not started.

---

## 1. Source vs. monorepo conventions

| | Source backend | Monorepo backends |
|---|---|---|
| Module system | CommonJS (`require`) | ESM (`"type":"module"`) |
| Env loading | `dotenv` | `node --env-file=.env.<env>` (Node 22) |
| Framework | Express 5, Mongoose 8 | Express 5, Mongoose 9 |
| Domain code | All in-app (63 files) | Pulled from `packages/{domains,integrations,shared}` as `workspace:*` |
| Package name | `emirateslimo-backend` | `@travel-suite/<app>-backend` |
| Deploy | VPS via docker-compose + nginx (`~/emirateslimo-backend`) | Fly.io via `fly.<app>-backend.toml` (region `fra`, port 3001) |
| Build | single-stage Dockerfile | multi-stage Dockerfile at app root |

---

## 2. Current state of the monorepo scaffold (must be overwritten)

`apps/emirateslimo-backend` was scaffolded as an **incomplete copy of airportrides** — none of it is emirateslimo-specific:

- ❌ `package.json` name is still `@travel-suite/airportrides-backend`; deps are airportrides's (paypal, flights, tickets — unused by emirateslimo)
- ❌ `.env.*` hold airportrides values (airportrides **Mongo URI/DB**, PayPal keys, `airportrides.com` CORS)
- ❌ `Dockerfile` copies `apps/airportrides-backend/` paths
- ❌ **No `src/`** — zero code
- ❌ Not in `pnpm-lock.yaml`; no `fly.emirateslimo-backend.toml`

`apps/emirateslimo-frontend` is in the same half-broken state (out of scope here).

**Action:** treat the scaffold as throwaway. Overwrite every file. The biggest risk is
the env still pointing at the **airportrides database** — must use emirateslimo's own
cluster/db and real keys (sourced from `emirateslimo/Website/emirateslimo-backend/.env.*`).

---

## 3. Domain mapping (source → target)

| Source domain | Target | Verdict | Notes |
|---|---|---|---|
| locations | `@travel-suite/locations` | Reuse as-is | ~99% identical (Google Places + IPInfo). Inject API keys. |
| currency | `@travel-suite/currencies` | Reuse as-is | ~98% identical. Port `convertFromBase()` as a small util (not in shared service). |
| payments (Stripe) | `@travel-suite/payments` | Reuse as-is | Stripe-first; shared webhook (idempotency + dispatcher) is better than source. `paypal/applePay/cash` are enum values only; Stripe is the live path. |
| blog (models + CRUD) | `@travel-suite/blog` | Reuse as-is | Schemas identical. Change author ref `User` → `admin-user`. Pass Cloudinary `imageStorage` adapter. |
| auth + user (admin/agent/blog-manager) | `@travel-suite/auth` (+ `@travel-suite/admin-users`) | Reuse as-is | **Decided: do NOT extend.** Adopt the shared auth/admin-user model and code unchanged; conform emirateslimo to it (drop source username-editability + any custom user fields rather than modifying the shared package). No public-user signup → skip `@travel-suite/users`. |
| vehicle | `@travel-suite/vehicles` 🆕 | New package | Cloudinary images (multer), pricing (`pricePerKm`, hourly rates hour1–8). |
| zone | `@travel-suite/zones` 🆕 | New package | GeoJSON + 2dsphere index, `getZoneByPoint`. |
| pricing-rules | `@travel-suite/pricing-rules` 🆕 | New package | Depends on vehicles + zones. |
| availability-rules | `@travel-suite/availability-rules` 🆕 | New package | Depends on vehicles + zones. |
| booking | `@travel-suite/limo-bookings` 🆕 | New package | **Decided:** own package (source booking ~30% overlap with shared `bookings`). Wires to vehicles/zones/payments. |
| AI blog generation (Anthropic + DALL·E, in-process `node-cron`) | root `scripts/` + GitHub Action | Relocate | Follow existing `travl-daily-blog-draft.yml` pattern; drop in-process cron. |

### Why limo-bookings is its own package
Source `Booking` is a true limo booking: `tripType` (distance/hourly), `hoursBooked`,
zone-referenced pickup/dropoff with location `type`, vehicle ref, detailed `orderSummary`
breakdown, 6-char `bookingRef`, embedded `payment`, agent-assignment `status` flow
(`pending → confirmed → assigned → in-progress → completed → cancelled`), `handledBy`.
Shared `@travel-suite/bookings` is a flat-fare airport transfer (passengers/luggage,
external payment, 5-state status). Extending the shared package would pollute it for the
4 other brands, so emirateslimo gets its own.

---

## 4. New shared-package conventions (template: `packages/domains/currencies`)

```
packages/domains/<domain>/
├── package.json        # @travel-suite/<domain>, "type":"module", main+exports ./src/index.js
└── src/
    ├── index.js        # factory: getOrRegisterModel + createRouter({ db, auth, ... })
    ├── schema.js       # Mongoose schema (not model)
    ├── service.js      # createXxxService({ Model }) factory
    ├── controller.js   # createXxxController({ service }) factory
    ├── router.js       # createXxxRouterFromParts({ controller, auth })
    └── validators.js   # createXxxSchema / updateXxxSchema (custom + AppError)
```

- ESM throughout; dependency injection (db/auth passed in, never imported).
- `dependencies`: `@travel-suite/utils` (`workspace:*`) for `AppError`/`catchAsync`.
- `peerDependencies`: express ^5, mongoose ^9.

Build order (dependency-respecting): **vehicles, zones** → **pricing-rules,
availability-rules, limo-bookings**.

**Collection naming:** multi-word models pin an explicit hyphenated `collection` (e.g.
`pricing-rules`, `availability-rules`) to match the repo convention (`admin-users`,
`blog-tags`, `stripe-webhook-events`) — mongoose's default pluralization would otherwise
produce `pricingrules`/`availabilityrules`. The stale off-convention collections were
dropped from the DB (were empty; fresh database).

---

## 5. Phased plan (with gates)

### Guardrails
- Source at `emirateslimo/Website/emirateslimo-backend` stays **untouched** as
  reference/rollback until the monorepo backend is verified running.
- Copy **code only** — never the source's nested `.git`.
- Env must use emirateslimo's **own** Mongo cluster/db (`emirateslimo`) and real keys,
  not the airportrides values currently in the scaffold.

### Phase 1 — New shared packages (bottom-up)
Scaffold `vehicles` + `zones` first (no deps), then `pricing-rules`,
`availability-rules`, `limo-bookings`. Use `currencies` as the structural template.
**Gate:** each package builds & lints in isolation.

Progress:
- [x] `@travel-suite/zones` — built, imports clean, router matches source
      (GET/POST `/`, GET `/find/by-point`, GET/PATCH/DELETE `/:id`, POST `/:id/duplicate`).
- [x] `@travel-suite/vehicles` — built, imports clean, router matches source
      (GET/POST `/`, GET/PATCH/DELETE `/:id`, POST `/:id/duplicate`, DELETE `/:id/images`).
      Multer upload middleware in-package; Cloudinary via injected `images` adapter
      (`uploadImage(buffer, folder)`, `deleteImage(url)`, `deleteFolder(folder)`) — wired in Phase 2.
- [x] `@travel-suite/pricing-rules` — built & verified (refs vehicles + zones for model
      registration; auto-builds rule name from vehicle/zone names). Routes match source.
- [x] `@travel-suite/availability-rules` — built & verified. Zod validation via `req.validatedBody`
      (faithful to source's validate middleware). Routes match source.
- [x] `@travel-suite/limo-bookings` — built & verified. Booking CRUD + pricing engine
      (`getVehiclesForTrip`) + Stripe checkout/refund. Reuses shared `@travel-suite/payments`:
      Stripe client + `createStripeWebhookHandler` (idempotent dispatcher) injected by the app;
      package exports `createBookingPaymentHandler` for the `booking` productType key. Booking
      `handledBy` ref retargeted `User` → `admin-user` (shared auth model). Routes match source.

**Phase 1 COMPLETE** — all 5 new packages build, import cleanly, and register in `pnpm-lock.yaml`
(40 workspace projects). Verified by stubbed router-build smoke tests (route surfaces identical to source).

Faithfulness notes:
- Response shapes preserved exactly from source (admin frontend depends on them).
- No new request-validation layer — source relied on Mongoose validation; kept that way.
- One small fix in vehicles: missing featured image now returns 400 (source returned a
  misleading 500 "Uploads rolled back"); happy path unchanged.

### Phase 2 — Thin backend shell  ✅ COMPLETE (code) / live-DB check deferred
Built `apps/emirateslimo-backend` modeled on `airportrides-backend` style:
- `package.json` — name `@travel-suite/emirateslimo-backend`, correct workspace deps
  (dropped airportrides's paypal/flights/tickets/bookings/users/notifications; added the
  5 new packages + cloudinary/payments). Scripts use `node --env-file=`.
- `src/utils/config.js` — central env config (EL_FRONTEND→FRONTEND_URL, EL_ADMIN→ADMIN_URL,
  CONTACT_EMAIL, CORS_ORIGINS, stripe/cloudinary/googleMaps/ipInfo, anthropic/openai for Phase 3).
- `src/utils/db.js`, `src/utils/email.js` (Brevo, sender "Emirates Limo").
- `src/notifications/booking.js` — ported payment-confirmation emails (admin + customer HTML),
  parametrized (adminUrl/contactEmail); consumed by the limo-bookings webhook handler.
- `src/routes/index.js` — wires auth, admin-users, blog(+tags), currencies, locations,
  vehicles, zones, pricing-rules, availability-rules, limo-bookings, payments(admin). Builds the
  Stripe client + webhook dispatcher (`booking` + `payment-link` handlers). Vehicle Cloudinary
  adapter built from shared `createCloudinaryStorage` (base folder `emirateslimo`).
- `src/app.js` — request-id logging, raw-body Stripe webhook before json, helmet/cors/compression/
  cookie-parser, rate limit, /health, 404 + global error handler. `trust proxy` set (Fly).
- `src/server.js` — connectDB + listen + graceful shutdown.
- `scripts/migrate-admin-users.js` — one-time cutover copying `users` → `admin-users`.
- `.env.development` / `.env.production` — real emirateslimo values (own Atlas DB + keys).

In-process blog cron dropped (relocates to Phase 3). Dropped: vercel.json, docker-compose,
nginx, kubernetes, VPS deploy workflow, sanitize middleware, `crypto` dep.

**Gate results:**
- ✅ Offline construct test — `import('./src/app.js')` builds the entire wiring graph
  (all 13 route groups, model registration, Stripe/Cloudinary clients, webhook handler). Clean.
- ⚠️ Live boot — server runs the full boot sequence correctly but cannot reach MongoDB Atlas
  from this machine (IP not whitelisted). Code is proven correct up to the network call.
  Live read-endpoint + auth checks are deferred to Phase 5 (needs Atlas IP whitelist + the
  admin-user data migration).

**Data-compat note (critical for Phase 5):** existing admin/agent accounts live in the
`users` collection; the shared auth model reads `admin-users`. Login works only after running
`migrate-admin-users:prod` (script provided, NOT yet run — it touches the production DB).

### Phase 3 — AI blog generation relocated  ⏭️ SKIPPED (per user)
Not done. The migrated backend ships **without** AI blog generation (in-process cron was
removed in Phase 2; blog CRUD still works via `@travel-suite/blog`). Source retains the
original `blogGeneratorService.js` if this is revisited later.

### Phase 4 — Infra  ✅ COMPLETE (code) / docker build pending daemon
- `apps/emirateslimo-backend/Dockerfile` — real multi-stage build (base → deps → runner),
  replacing the airportrides clone. COPYs the 13 workspace package.json files this app
  actually needs (utils, auth, admin-users, blog, cloudinary, currencies, locations,
  payments, vehicles, zones, pricing-rules, availability-rules, limo-bookings) + the app,
  `pnpm install --frozen-lockfile`, then `node src/server.js` from the app dir. Port 3001.
- `fly.emirateslimo-backend.toml` (monorepo root) — `app = "emirateslimo-backend"`,
  region `fra`, dockerfile path, internal_port 3001, 512mb shared-cpu-1x. Matches siblings.
- `.env.*` already correct (Phase 2). Runtime secrets come from Fly (env files are
  `.dockerignore`d and never shipped; CMD runs `node src/server.js`, env injected by Fly).

**Gate results:**
- ✅ All 17 Dockerfile COPY paths exist.
- ✅ `pnpm install --frozen-lockfile` passes (lockfile in sync → deps stage will succeed).
- ⏳ `docker build` not executed — Docker daemon not running on this machine. Build is
  expected to succeed given the two checks above; run when the daemon is up.

### Phase 5 — Install, verify, deploy  🔶 IN PROGRESS
`pnpm install` (registers app + new packages in `pnpm-lock.yaml`) → smoke-test endpoints
against emirateslimo DB → deploy to Fly.

**Live smoke test (dev env, real DB) — DONE:**
- ✅ `/health` → `{status:"ok",brand:"emirateslimo"}`
- ✅ `GET /api/currencies`, `/api/zones`, `/api/blogs`, `/api/pricing-rules`,
  `/api/availability-rules` → 200 (all empty — fresh DB)
- ✅ `GET /api/vehicles` → 404 "No vehicles found" (faithful empty-list behavior from source)
- ✅ `GET /api/bookings` → 401 (auth gate works); bad-creds login → 400 (validation works)

**Bug found & fixed during smoke test:** the `pre(/^find/)` populate hooks in
pricing-rules / availability-rules / limo-bookings used the Mongoose-8 `function(next){…next()}`
callback form. Under this repo's Mongoose 9 the hook gets no `next` → "next is not a function"
(500). Converted all three to the no-arg `function(){…}` form (the shared packages' convention).
Re-verified 200.

**Deploy to Fly — DONE:**
- Created app `emirateslimo-backend` (org personal, region fra).
- Secrets staged via `flyctl secrets import` from `.env.production`, **plus** `ADMIN_URL`
  and `CONTACT_EMAIL` (these were dropped from `.env.production`; without `ADMIN_URL` the
  booking admin-email links would default to localhost).
- `flyctl deploy -c fly.emirateslimo-backend.toml --remote-only` — remote build succeeded
  (78 MB image; this also validates the Dockerfile since the local daemon was down). 2 machines.
- Live at **https://emirateslimo-backend.fly.dev** — verified `/health`, `/api/currencies`,
  `/api/zones` → 200; `/api/bookings` → 401. (A deploy-time "not listening" warning was a
  premature health check — logs confirm "MongoDB connected" + "started" on both machines.)

**Remaining (user-owned):**
- Create an admin account (user is handling) — login is by **email** (shared auth).
- Point the Stripe **webhook** at `https://emirateslimo-backend.fly.dev/api/webhook` and
  confirm `STRIPE_WEBHOOK_SECRET` matches that endpoint (else booking payment confirmations
  won't fire).
- Re-add `ADMIN_URL` / `CONTACT_EMAIL` to `.env.production` for parity with the Fly secrets.

**Follow-up (frontend, out of scope):** `@travel-suite/auth` logs in by **email**, not
username — the admin frontend must send `email`.

---

## 6. Cross-cutting tasks
- CommonJS → ESM for all ported code.
- `dotenv` → `--env-file`; Mongoose 8 → 9 (check breaking changes in queries/strictQuery).
- Update author ref `User` → `admin-user` in blog usage.
- Hardcoded values to parametrize via env: CORS origins, `api.emirateslimo.com`,
  `admin.emirateslimo.com`, `contact@emirateslimo.com`, Cloudinary folder
  `emirateslimo/emirateslimo_blog`.
- Auth/users: use shared `@travel-suite/auth` + `@travel-suite/admin-users` **as-is**;
  conform emirateslimo's usage (no shared-package edits). Drop source-only deltas
  (username editability). New domain packages take the shared `auth` middleware via DI.
- Port `convertFromBase()` currency helper.
- Drop unused source artifacts: `vercel.json`, `docker-compose.yml`, `nginx/`,
  `kubernetes/`, source `.github/workflows/deploy.yml` (VPS), `crypto` dep (built-in).

## 7. Open follow-ups (not in this scope)
- `apps/emirateslimo-frontend` is half-migrated (airportrides clone, no `src/`).
- Secret hygiene: monorepo commits real keys in `.env.*` per existing convention; confirm
  whether emirateslimo keys should be rotated as part of the move.
