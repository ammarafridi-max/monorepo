# Picturesk.ai

AI headshot generator: upload selfies, pick a one-time plan (three tiers, from
$9), we fine-tune a model on your face via Replicate, generate professional
headshots, and email the results.

Core design principle: **money in, then a slow external job we don't control;
never lose or double-run an order.** See [CLAUDE.md](./CLAUDE.md) for the full
design and build plan.

## Layout

- `apps/picturesk-frontend` - Next.js frontend: upload, checkout kickoff, live status + results (Phase 4).
- `apps/picturesk-backend` - Express service: real Stripe Checkout + webhook that drive the pipeline (Phase 2).
- `apps/picturesk-backend` - BullMQ worker: drives orders through real Replicate training + generation (Phase 3).
- `packages/picturesk-shared` - shared order contracts, the atomic transition helper, and the Redis connection helper.

## Multi-step funnel (select, upload, payment)

The purchase flow is a routed, three-step funnel under `/ai-headshot-generator`:

```
Select (plan + about-you + looks + attire + email) -> Upload photos -> Payment -> processing -> Delivered
```

The customer picks a plan, tells us a bit about themselves (gender and age range,
race optional), picks looks and attire, and enters an email (one merged step),
uploads their photos, then pays. Payment is the last step; the order is created at
checkout already carrying the selections AND the photos. This is the one purchase
flow; the old single-page upload+pay flow is gone. (The old `/generator/*` URLs
permanent-redirect to their `/ai-headshot-generator/*` equivalents, `pay ->
payment`, in `apps/picturesk-frontend/next.config.mjs`.)

**State machine.**

```
AWAITING_PAYMENT -> PAID -> TRAINING -> GENERATING -> DELIVERED
```

`PAID` is the webhook's idempotency checkpoint and where the pipeline is enqueued;
the worker then moves `PAID -> TRAINING`.

**The web funnel (`apps/picturesk-frontend/app/ai-headshot-generator/(funnel)`).** A shared stepper
layout over three routes: `/ai-headshot-generator/select` (pick a plan first, then
gender + age range + optional race as single-select chips with the facial-hair field
carrying an info tooltip, then looks + attire each with a preview image or a
placeholder, then email), `/ai-headshot-generator/upload` (each photo is uploaded to
R2 and server-gated as it is added; the green tick appears only after it passes), and
`/ai-headshot-generator/payment` (review and pay - which now only retrieves the Stripe
URL). Selections and uploaded-photo URLs persist in `localStorage` until checkout, so
the order is created only at the payment step (no abandoned drafts in the DB). Landing
CTAs route to `/ai-headshot-generator/select`.

**Where the gate runs.** Photos are screened at the **upload step, not at
checkout.** As each photo is added on `/ai-headshot-generator/upload` it is uploaded to R2 and
run through the real server gate (`POST /uploads/gate`: face quality + content
moderation); its green tick appears only after that gate passes, and a failure flags
the photo with a reason so the user swaps it before continuing. `POST /checkout` then
takes `{ email, selectedLooks[], selectedAttire[], gender, ageRange, race?,
uploadedImageUrls[], tier }`, validates the selections + demographics against the
shared catalog (gender + ageRange required, race optional) and the `tier` against the
shared pricing catalog (invalid tier -> 400, absent -> the default `starter`), and
then does nothing but create the order + Stripe session. The server owns the price:
the client sends only a tier id, never an amount, and the Stripe amount comes from
`getTier(tier).priceCents`. So **checkout makes no Replicate calls and returns the
payment URL immediately** (the pay step just retrieves the URL). It creates the order
in `AWAITING_PAYMENT` and returns the Stripe checkout URL; the webhook then does the
idempotent `AWAITING_PAYMENT -> PAID` and enqueues the pipeline exactly once (`jobId =
orderId`). Trade-off: because the gate no longer runs at checkout, content moderation
happens only at the upload step, so a direct `/checkout` API call (bypassing the UI)
skips it; the normal funnel always gates.

**Shared catalog + prompts.** `packages/picturesk-shared/src/catalog.js` is the single source
of truth for the `LOOKS` and `ATTIRE` options (each with a `label`, a
`promptFragment`, and an `image` preview slot), the subject demographics
(`GENDERS`, `AGE_RANGES`, `RACES`), AND the pure builders that turn a selection into
generation prompts: `buildSubject({ gender, ageRange, race })` renders the subject
phrase that leads every prompt (e.g. "a woman in their late twenties, of South Asian
descent", falling back to a generic "a person"), and `buildPrompts({ looks, attire,
count, subjectAnchor })` cycles the look x attire combinations into `count` prompts.
The web renders its selection cards and chips from this file (via the
`@travel-suite/picturesk-shared/catalog` subpath, which is mongoose-free and client-safe) and the
worker builds each order's prompts from it, so the options a customer sees can never
drift from what we generate. The worker's old fixed `PROMPTS` array is gone from the
order path; each order's subject anchor is `<trigger word>, <buildSubject(...)>`.
Every generated prompt ends with a shared `QUALITY_TAIL` (photographer framing: an
85mm portrait lens, head-and-shoulders with headroom for LinkedIn's circular crop,
and shallow depth of field) so results read as shot by a photographer, not a selfie.

**Count.** How many headshots an order delivers comes from its purchased pricing
tier (see below), snapshotted onto the order at checkout as `deliverCount` /
`generateCount`; the worker reads them per order. Identity culling is off, so the
worker generates exactly what it delivers (generate == deliver). Legacy pre-tier
orders leave those fields unset and fall back to the `DELIVER_COUNT` /
`GENERATE_COUNT` env defaults.

**Preserved guarantees.** Idempotent webhook, idempotent enqueue (`jobId =
orderId`), resumable/idempotent pipeline, auto-refund on `FAILED`, and idempotent
email are all unchanged.

## Pricing tiers

Three one-time plans (no subscription). The catalog is the single source of truth in
`packages/picturesk-shared/src/pricing.js` (`TIERS`, `getTier`, `isValidTier`, `DEFAULT_TIER`),
imported by both the api (to set the Stripe amount + stamp the order) and the web
(via the mongoose-free `@travel-suite/picturesk-shared/pricing` subpath, to render the plan
cards), so price, delivered count, and turnaround can never drift between them.

| Tier    | id        | Price | Headshots | Turnaround (BullMQ priority)     |
| ------- | --------- | ----- | --------- | -------------------------------- |
| Starter | `starter` | $9    | 5         | standard (priority 3)            |
| Pro     | `pro`     | $29   | 25        | priority (2), "Most popular"     |
| Premium | `premium` | $49   | 60        | front of queue (1)               |

Each tier differs on three levers: **price** (`priceCents`), **delivered count**
(`deliverCount` / `generateCount`), and **turnaround**. Turnaround is the BullMQ job
`priority` set at enqueue (lower number = pulled off the queue first), so a Premium
order jumps ahead of a queued Starter one. The worker runs one order at a time by
default (`WORKER_CONCURRENCY`, default 1), which is why priority matters; raise it to
process orders in parallel (an order is mostly Replicate polling, so a single process
handles many cheaply, bounded by Replicate rate limit + credit).

The tier is stored on the order **as a snapshot** (`tier` + `deliverCount` +
`generateCount`), not looked up live, so changing the catalog never mutates an
in-flight order. Quality levers (4K upscale, face-swap identity lock) are a planned
phase 2 and are not tier-gated yet.

## Getting started

```sh
pnpm install
cp .env.example .env   # then fill in values
```

## Running locally

The api and worker **require a running MongoDB and Redis.** Set both in `.env`:

- `MONGODB_URI` - e.g. `mongodb://127.0.0.1:27017/picturesk`
- `REDIS_URL` - e.g. `redis://127.0.0.1:6379`

> **Use a LOCAL Redis for dev, never the production one.** A BullMQ worker polls
> Redis continuously (even with zero orders), so a local worker plus the deployed
> worker on one managed Redis doubles the usage and can blow a metered/free plan by
> itself. Spin up a throwaway local Redis and point `REDIS_URL` at it:
> `docker run -p 6379:6379 redis`. The worker ships with Redis-frugal defaults
> (long idle-block, infrequent stalled checks) tunable via `WORKER_DRAIN_DELAY_S`,
> `WORKER_STALLED_INTERVAL_MS`, `WORKER_LOCK_DURATION_MS`.

Start the api and worker together (or run them separately with `pnpm api` and
`pnpm worker`):

```sh
pnpm dev
```

The worker drives an order through the pipeline (`PAID -> TRAINING ->
GENERATING -> DELIVERED`). As of Phase 3 the training and generation stages make
real Replicate calls, so a real run takes several minutes (see below). Poll an
order to watch it advance:

```sh
curl -s localhost:3001/orders/<orderId>
```

## Deploying (Fly.io)

Three Fly apps (`api`, `web`, `worker`), each built from the monorepo root, with
MongoDB and Redis as external managed services. Dockerfiles (`apps/picturesk-backend/Dockerfile`,
`apps/picturesk-backend/Dockerfile`, `apps/picturesk-frontend/Dockerfile`) and Fly configs (`fly.picturesk-api.toml`,
`fly.picturesk-worker.toml`, `fly.picturesk-web.toml`) are in the repo root; `pnpm deploy:api` /
`deploy:web` / `deploy:worker` wrap `fly deploy`. Full runbook (create apps, set
per-app secrets, deploy order, Stripe webhook + R2 CORS wiring) in
[DEPLOY.md](./DEPLOY.md).

### Live deployment status

All three apps are deployed to Fly and live on the custom domain, running an order
end to end (checkout -> train -> generate -> deliver -> email):

- web: https://www.picturesk.ai (also serves `/admin`)
- api: https://api.picturesk.ai (`/health` returns `{"ok":true}`)
- worker: `picturesk-worker` (no HTTP; consumes `order-pipeline`, `WORKER_CONCURRENCY` default 1)

Secrets are staged per app (least-privilege: Stripe keys on api + worker only, never
web), with `WEB_BASE_URL=https://www.picturesk.ai` and `TRUST_PROXY_HOPS=1` on the
api. In place: the production Stripe webhook at `/webhooks/stripe`, R2 CORS for the
web origin, Google OAuth sign-in, GA4 + Microsoft Clarity behind the consent banner,
and Brevo delivery email. `NEXT_PUBLIC_*` values are build args (see `fly.picturesk-web.toml`),
so a web redeploy is required to change them.

**Still deferred (revisit before scaling):**

- **Stripe mode.** Confirm live keys + a live webhook endpoint before taking real
  charges (test keys are `sk_test_...`).
- **Delivery email sender.** Support address is `info@picturesk.ai`; verify the
  `hello@picturesk.ai` sender in Brevo.
- **Legal/compliance** items (see the deferred section near the end).

## Phase 2: testing locally with the Stripe CLI

Phase 2 adds real payments. `POST /checkout` creates an order and a Stripe
Checkout Session; Stripe then calls `POST /webhooks/stripe`, which is the
idempotency boundary that marks the order paid and enqueues the pipeline exactly
once. You also need `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in `.env`.

1. Start the services (needs Mongo + Redis):

   ```sh
   pnpm dev
   ```

2. Forward Stripe events to the webhook with the [Stripe CLI](https://stripe.com/docs/stripe-cli):

   ```sh
   stripe listen --forward-to localhost:3001/webhooks/stripe
   ```

   Copy the `whsec_...` it prints into `STRIPE_WEBHOOK_SECRET` in `.env`, then
   restart the api.

3. Create a checkout and open the returned `checkoutUrl` in a browser. `/checkout`
   now takes the full funnel payload and runs the upload gate on real image URLs
   before creating the session (see the funnel section above), so the practical way
   to exercise it end to end is the web UI (Phase 4). The shape is:

   ```sh
   curl -s -X POST localhost:3001/checkout \
     -H 'content-type: application/json' \
     -d '{
       "email":"test@example.com",
       "selectedLooks":["corporate_studio"],
       "selectedAttire":["business_suit"],
       "gender":"man","ageRange":"age_25_34",
       "uploadedImageUrls":["https://<your-r2>/selfie1.jpg","https://<your-r2>/selfie2.jpg"]
     }'
   # -> { "orderId": "...", "checkoutUrl": "https://checkout.stripe.com/..." }
   # (the URLs must be real, reachable photos that pass the face + moderation gate,
   #  or you get a 422 instead; set UPLOAD_QUALITY_GATE=off in dev to skip it)
   ```

   Pay with test card `4242 4242 4242 4242`, any future expiry, any CVC.

4. Watch the webhook fire and the order walk from paid to delivered:

   ```sh
   curl -s localhost:3001/orders/<orderId>
   ```

## Phase 3: real Replicate compute

Phase 3 replaces the worker's stubs with real Replicate work: it fine-tunes a
Flux LoRA on the customer's photos (`ostris/flux-dev-lora-trainer`), then
generates one headshot per prompt from the trained model. Each stage is
resumable and idempotent: a crash mid-training reattaches to the same training,
and a crash mid-generation only re-drives the images that had not finished. Real
Replicate cost accumulates into `computeCostCents` as margin telemetry.

**A real training takes several minutes** (roughly 20-30 min for the trainer,
then a few seconds per generated image), so a full `PAID -> DELIVERED` run is
minutes, not seconds.

Set these in `.env` (on top of the Phase 2 values):

- `REPLICATE_API_TOKEN` - from https://replicate.com/account/api-tokens
- `REPLICATE_DESTINATION_MODEL` - `your-username/picturesk-headshots`; the worker
  creates it automatically on first run if it does not exist.
- `TEST_IMAGE_ZIP_URL` - a publicly reachable zip of ~10-15 selfies of one person
  to train on. Phase 4 replaces this with the order's real uploaded images.

Then run a real end-to-end order:

1. Start the services and forward Stripe events (as in Phase 2):

   ```sh
   pnpm dev
   stripe listen --forward-to localhost:3001/webhooks/stripe
   ```

2. Do a real checkout (`POST /checkout`, open `checkoutUrl`, pay with test card
   `4242 4242 4242 4242`).

3. Watch the order walk `PAID -> TRAINING -> GENERATING -> DELIVERED` over a few
   minutes. When delivered, `resultImageUrls` holds the real generated headshots
   and `computeCostCents` holds what the run cost:

   ```sh
   curl -s localhost:3001/orders/<orderId>
   ```

## Phase 4: uploads, frontend, and delivery

Phase 4 adds the customer-facing flow. Photos upload straight from the browser to
R2 (presigned PUT, never through the api); the worker trains on the order's real
images and emails the results when the order is delivered.

New env (see `.env.example`): R2 storage (`R2_*`), email (`BREVO_API_KEY`,
`BREVO_SENDER`), `WEB_BASE_URL`, and `NEXT_PUBLIC_API_BASE_URL` for the web app.

Delivery email is sent via Brevo (transactional API) from the shared
`createEmailClient` helper in `@travel-suite/picturesk-shared`. It is a branded HTML template
(with a plain-text alternative) linking to the order's results page. Leave
`BREVO_API_KEY` empty in local dev to make delivery a no-op.

Enable public read on the R2 bucket (r2.dev or a custom domain set as
`R2_PUBLIC_BASE_URL`) and add a bucket CORS rule allowing `PUT` from
`WEB_BASE_URL`, so the browser can upload directly.

Run the full stack:

```sh
pnpm dev                                   # api + worker (needs Mongo + Redis)
pnpm web                                   # the Next.js app on :3000
stripe listen --forward-to localhost:3001/webhooks/stripe
```

Open http://localhost:3000, add ~10-15 selfies of one person, enter an email, and
pay with test card `4242 4242 4242 4242`. Stripe returns to `/success`, which
polls the order and walks paid -> training -> generating -> delivered, then shows
the results gallery. When it hits delivered, the worker emails the results link
exactly once (guarded by `deliveredEmailSentAt`).

**Downloads.** Each headshot has its own download control, served by
`GET /orders/:id/download/:index`, and **"Download all" saves a single zip**
(`picturesk-headshots.zip`) via `GET /orders/:id/download-all`. The delivered images
are hosted by Replicate (`replicate.delivery`), not our R2 bucket, so both routes
fetch the stored URL(s) server-side and re-stream with `Content-Disposition:
attachment`, so the browser DOWNLOADS the file instead of opening it in a new tab
(the plain `<a download>` attribute is ignored for cross-origin URLs). The zip route
fetches every image up front (bounded concurrency) so an expired/failed upstream
returns a clean `502` before any zip bytes are sent, never a truncated archive, then
bundles the buffers with `archiver` using STORE (JPEGs are already compressed). URLs
are never request parameters: they are read from the order in our DB and picked by a
validated index (only the same culled delivered set the page shows), so there is no
SSRF surface, and downloads do not depend on any cross-origin CORS config. Each
headshot also has an **eye** button that opens it full-size in a lightbox modal (a
shared `Lightbox` component, reused on the admin order page where every thumbnail
opens the same viewer). The success gallery lays the delivered headshots out
4-per-row on desktop, 2 on phones.

## Phase 5: failure hardening

Phase 5 makes the system safe to point real customers at. No new product features.

- **Auto-refund on failure.** When an order moves to FAILED and the customer paid,
  the worker issues a Stripe refund exactly once, guarded by `refundedAt` and a
  Stripe idempotency key (`refund:<orderId>`). A restart that re-enters FAILED
  sees `refundedAt` set and does not refund again.
- **Email retry.** A DELIVERED order whose email has not sent (`deliveredEmailSentAt`
  unset) retries via the queue; the guard keeps it exactly once. Email never
  affects order state.
- **Observability.** `GET /admin/orders` (set `ADMIN_TOKEN`, send it as
  `Authorization: Bearer <token>`) lists orders with their transition timestamps,
  flags any non-terminal order stuck past `ADMIN_STUCK_MINUTES`, and shows
  `marginCents` (amount paid minus compute cost) per delivered order.

  ```sh
  curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
    'localhost:3001/admin/orders?status=TRAINING' | jq
  ```

- **Failure UX.** A FAILED order's success page shows a calm message and whether
  the payment was refunded, with no scary language.

The worker now also needs `STRIPE_SECRET_KEY` (for refunds).

## Accounts (optional)

Buying is anonymous: the upload and checkout flow needs only an email, unchanged.
Accounts are an additive layer for returning customers to see past orders. Nothing
in the buy flow is gated; the only gated page is `/account`.

- **User model:** `users` collection in `@travel-suite/picturesk-shared` (`User`), email +
  bcrypt `passwordHash`. Orders gain an optional, nullable `userId`; anonymous
  orders leave it null.
- **Sessions:** a signed JWT (`jose`) in a secure httpOnly cookie, hand-rolled to
  match the repo's minimal style (no NextAuth adapter fighting our Mongoose model).
  Set `AUTH_SECRET` (`openssl rand -hex 32`). The web app reads the same root
  `.env` as the services (loaded in `next.config.mjs`).
- **Social sign-in (optional):** Google, Facebook, and LinkedIn, hand-rolled in the
  same style (a small OAuth 2.0 / OIDC code flow that upserts the same `User` and
  issues the same session cookie, no NextAuth adapter). A provider appears on the
  login and signup pages only when its `*_CLIENT_ID` and `*_CLIENT_SECRET` are set.
  Register the redirect URI `<WEB_BASE_URL>/api/auth/oauth/<provider>/callback` with
  each provider. Social accounts are passwordless; email is still the one identity
  anchor, so Google and password sign-in on the same address are one account.
- **Pages/routes:** `/signup`, `/login`, `/account`, a POST `/api/auth/logout`, and
  `/api/auth/oauth/<provider>` (start) + `/api/auth/oauth/<provider>/callback`.
- **Linking orders:** a logged-in checkout links the new order to the account
  (only when the order email matches the session, so a guessed id cannot claim
  someone else's order). Signup and login also back-link past anonymous orders
  that share the account email.
- **Account page:** a tabbed dashboard (Orders + Settings) with a Sign-out button,
  change/set password, and delete-account. Past orders each link to their results
  and a "Download all". In **development only** (`NODE_ENV=development`) each order row also
  shows a per-record **Delete** button (`DELETE /api/account/orders/[id]`, hard-gated
  to development on the server) so a developer can prune their own test orders; it is
  never rendered or reachable in production.

## Admin panel

Staff-only area to see every order, revenue/margin, stuck orders, and customers.
Separate from customer accounts: a distinct `AdminUser` identity, a distinct cookie,
and its own login. Modeled on the shared admin/auth pattern from the travel-suite
monorepo, right-sized to this repo (layered modules in `apps/picturesk-backend`, not DI packages).

- **Identity:** the shared `admin-user` model from `@travel-suite/auth` (name,
  username, email, bcrypt `password`, `role` in `admin|support`, `status`,
  `passwordChangedAt`), stored in the `admin-users` collection. `admin` is full
  access; `support` is read-only. Hashing is a schema pre-save hook.
- **Auth (api):** `POST /auth/login` (email + password) issues a JWT in an httpOnly
  cookie `jwt` (`{id, role, type:'admin'}`); `GET /auth/me`, `POST
/auth/logout`, `PATCH /auth/update-password`. `protect` + `restrictTo(...roles)`
  guard the routes. Set `ADMIN_JWT_SECRET` (`openssl rand -hex 32`) on the api;
  unset means `/auth` returns 503 (disabled).
- **Data (api, read-only):** `GET /admin/orders` (list, `?status`/`?limit`, stuck +
  margin), `/admin/orders/:id` (full detail), `/admin/stats` (revenue, compute cost,
  margin, counts, refunds, stuck), `/admin/customers`. All behind the cookie session
  OR the `ADMIN_TOKEN` break-glass header (for scripts). Both staff roles can read.
- **Order actions (api, admin only):** `POST /admin/orders/:id/refund` (Stripe
  refund with an idempotency key, stamps `refundedAt`, does not cancel an in-flight
  run), `POST /admin/orders/:id/retry` (re-enqueue a paid, in-progress order so the
  idempotent worker reattaches), `POST /admin/orders/:id/resend-email` (re-send the
  delivery email for a delivered order; needs `BREVO_API_KEY` on the api, else 503),
  `DELETE /admin/orders/:id` (hard-delete the order and remove the objects WE store
  for it in R2: the uploaded selfies, the training zip, and the persisted delivered
  images; the intermediate Replicate artifacts are ephemeral and skipped). Shown as
  buttons on the order-detail page for `admin` only. Delete is irreversible and drops
  the payment record, so it is a strong-confirm action meant for cleanup / removal.
- **Admin-user management (api, admin only):** `GET`/`POST /admin-users`,
  `GET`/`PATCH`/`DELETE /admin-users/:username`, `PATCH /admin-users/:username/password`
  (reset another user's password). Guarded by `restrictTo('admin')`, so `support`
  cannot reach it. Two invariants: at least one ACTIVE admin must always remain, and
  you cannot deactivate, demote, or delete your own account. Own profile/password
  changes are the `/auth/me` + `/auth/update-password` routes instead.
- **UI (web):** `/admin/login` then `/admin` (overview), `/admin/orders`,
  `/admin/orders/:id`, `/admin/customers`, `/admin/admins` (Team, admin only:
  create/edit/activate/delete staff + reset passwords), `/admin/account` (own profile
  - password). Cookie is the credential (`credentials:'include'`); a client guard
    redirects to login and hides admin-only nav from `support`. Not indexed. The
    customer topbar/footer are hidden on `/admin`.
- **Bootstrap the first admin:** set `ADMIN_JWT_SECRET` and a strong `SEED_PASSWORD`
  (plus optional `SEED_NAME/SEED_USERNAME/SEED_EMAIL`), then run
  created directly against the database (the seed script has been removed).
  Cross-origin note: in production the api and web are separate origins, so the admin
  cookie is `SameSite=None; Secure` and CORS runs with credentials pinned to
  `WEB_BASE_URL`. Both must be HTTPS for the cookie to stick.

## Upload quality gate

Bad photos are worse than a failed order: they train a model and then "succeed"
into a DELIVERED order, so the FAILED auto-refund never fires and the customer
paid for garbage. So we reject bad input at the UPLOAD step, before the user can
reach pay, not after training.

Two layers, and the server one is the real gate (same lesson as server-owned
pricing: client validation can be bypassed by calling the API directly):

- **Client (apps/picturesk-frontend):** on file add, the browser's `FaceDetector` runs per photo as
  a fast pre-check, flagging an obvious problem instantly ("No clear face", "More than
  one person", "Face too small, get closer"). It is Chromium-only and fail-open, so it
  never earns the green tick on its own -- a passing or deferred pre-check just
  proceeds to the server gate.
- **Server (apps/picturesk-backend, `POST /uploads/gate`):** each photo is uploaded to R2 and run
  through this gate AS IT IS ADDED. Only a server pass promotes the photo (green
  tick); a failure returns `422` with a per-image reason shown on the thumbnail, and
  Continue stays disabled until every photo passes. Checkout does NOT re-screen, so by
  the time the user pays every URL is already gated (this is also what makes the pay
  step instant). Detection runs on Replicate (reusing `REPLICATE_API_TOKEN`, no extra
  cloud account): `ultralytics/yolov8s-worldv2` on the "person" class. Tradeoff vs a
  true face-landmark detector: person detection reliably catches the important cases
  (zero subjects, or more than one), but the "too small" rule becomes a
  subject-box-size proxy, so a full-body shot with a small face can pass server-side.
  `detectFaces` is swappable if you later want a dedicated face model.

Rules per image: exactly one clear subject (zero = not a usable photo, two+ =
multiple people), and the subject must span at least `UPLOAD_MIN_FACE_RATIO` of
the frame. Plus the promised `UPLOAD_MIN_PHOTOS`..`UPLOAD_MAX_PHOTOS` count.

**Strict screen (sunglasses / hats).** A clean training set is the single biggest
lever on likeness (it is how Aragon and the top tier get resemblance), so on top of
face detection a vision model (Qwen2-VL, `apps/picturesk-backend/photoGate.js`) screens each photo
for the two unambiguous, training-wrecking cases yolov8 cannot see: dark sunglasses
that hide the eyes, and hats covering the head, mapped to a branded reason ("Take
the sunglasses off", "No hats or caps") shown on the pay step. It is deliberately
LENIENT -- subjective calls (blurry / dark) rejected good photos, so they are NOT
screened (face detection handles framing; mild softness/lighting is fine). This
runs SERVER-SIDE only (the client layer stays face detection). It **fails OPEN**:
a screen error or cold-boot timeout returns "no issue", so face detection +
moderation still gate and a transient vision blip never blocks a genuinely good
photo -- only an actual judgment rejects. On by default via `UPLOAD_STRICT_GATE`
(needs `UPLOAD_QUALITY_GATE` on); model overridable with `UPLOAD_PHOTO_GATE_MODEL`.
The upload step also carries an up-front "do / avoid" guide so customers get it
right the first time.

Tuning (all env, see `.env.example`): `UPLOAD_MIN_PHOTOS`, `UPLOAD_MAX_PHOTOS`,
`UPLOAD_MIN_FACE_RATIO`, mirrored to the client as `NEXT_PUBLIC_UPLOAD_*`, plus
`REPLICATE_FACE_MODEL_VERSION` / `REPLICATE_FACE_CONF`, plus the strict screen's
`UPLOAD_STRICT_GATE` (default on) and `UPLOAD_PHOTO_GATE_MODEL`. The gate is on by
default and fails closed. For local dev without a token wired up, set
`UPLOAD_QUALITY_GATE=off` (this re-opens the pay-for-garbage hole, so dev only).

## Tuning generation (dev)

Output quality is a GENERATING-stage concern (prompt + `lora_scale`), which is
cheap, not a TRAINING one, which is expensive. So you can iterate on quality
against an already-trained model for cents, without retraining and without going
through the order pipeline.

Two levers, both generation-only:

- **Prompt anchoring:** every prompt leads with the trigger word then a subject
  anchor. Naming the subject up front stops the base model's prior from drifting
  gender or facial hair on a weak-identity seed. Real orders derive that anchor from
  the customer's demographics (`buildSubject` in the shared catalog); the dev tuning
  script uses a fixed `SUBJECT` + `PROMPTS` set in `apps/picturesk-backend/replicateClient.js`
  so you can iterate on the model without an order. Edit `SUBJECT` there to try a
  different subject in the tuning script.
- **`GEN_LORA_SCALE`:** LoRA strength (~0.8 to 1.1; higher pulls harder toward the
  trained identity, too high risks artifacts).

Grab a trained model version from a prior order's `replicate.trainedModelVersion`
(e.g. `db.orders.findOne({status:'DELIVERED'}).replicate.trainedModelVersion`),
then run the generate-only script:

```sh
pnpm --filter @travel-suite/picturesk-backend tune:gen \
  --version <owner/name:hash> --scale 1.05 --count 3
```

It runs the real generation functions against that version, polls to completion,
prints each image URL, and saves a record under
a local results directory. It never creates an order or touches
Mongo/Redis/Stripe. Compare a few scales; once a scale looks good it is already
promoted, since `GEN_LORA_SCALE` is the default the worker reads for real orders.
(Real-order prompts come from the shared catalog + the customer's selections and
demographics, not the script's fixed `PROMPTS`.)

## Production safety

Two protective layers sit around the app: rate limiting on the public API, and
error tracking across all three services. Both are configured entirely through
env (see `.env.example`).

### Rate limiting (apps/picturesk-backend)

The public endpoints are unauthenticated, so they are rate limited per client IP:

- A generous **global** backstop on every route, sized above the success page's
  poll rate so normal use is never throttled.
- **Stricter** limits on `POST /uploads/presign` and `POST /checkout`, which cost
  storage and money and are the real abuse targets.
- The **Stripe webhook is exempt** (it is mounted before the limiter): Stripe can
  burst retries and must never be throttled.
- Over-limit requests get a clean `429` with a short JSON body and no internals.

The limiter keys on the real client IP. Behind Fly.io that means trusting exactly
one proxy hop (`app.set('trust proxy', 1)`), so `req.ip` is the client and not the
proxy or a spoofable header. Set `TRUST_PROXY_HOPS` if you add more proxies.

Knobs (all optional, defaults in parentheses): `RATE_LIMIT_WINDOW_MS` (15 min),
`RATE_LIMIT_MAX` (600), `RATE_LIMIT_PRESIGN_MAX` (20), `RATE_LIMIT_CHECKOUT_MAX`
(10), `TRUST_PROXY_HOPS` (1). `POST /uploads/presign` also caps files per request
and requires `image/*` content types, rejecting oversized/blocked batches with a
`400` before signing anything.

### Error tracking (Sentry)

All three services (`api`, `worker`, `web`) report errors to Sentry.

- **Disabled by default.** With `SENTRY_DSN` unset, Sentry is never initialised,
  every service boots and runs normally, and nothing is sent. Set the DSN to turn
  it on.
- `api` captures route and unhandled errors; `worker` reports every BullMQ job
  failure (and any refund/fail-transition error) so a failing pipeline surfaces;
  `web` captures client and server errors (App Router).
- **PII is scrubbed:** emails and uploaded-image URLs are redacted from event
  payloads, and request bodies/cookies are dropped. We want stack traces, not
  customer faces.
- Env: `SENTRY_DSN` (api, worker, web server), `NEXT_PUBLIC_SENTRY_DSN` (web
  browser, a build-time value so the web app must be rebuilt to enable it),
  optional `SENTRY_ENVIRONMENT`, `SENTRY_TRACES_SAMPLE_RATE` (default 0, errors
  only), `SENTRY_RELEASE`, and `SENTRY_ORG`/`SENTRY_PROJECT`/`SENTRY_AUTH_TOKEN`
  for optional web source-map upload.

### Content moderation

The quality gate checks that a usable face is present; **content moderation**
checks that an image is safe to accept. It runs server-side in `POST /uploads/gate`,
in parallel with the face check as each photo is uploaded, so unsafe images are
rejected at the upload step and can never be paid for, stored long-term, or sent to
training.

- Each image is screened by an NSFW classifier on Replicate (reusing
  `REPLICATE_API_TOKEN`, like the face detector). The tradeoff: this catches the
  dominant risk (explicit/sexual imagery) with one credential, but is not a
  compliance-grade illegal-content system. `moderateImage(url)` in
  `apps/picturesk-backend/contentModerator.js` is a swappable interface: drop in AWS Rekognition
  Moderation, Hive, or Google Vision SafeSearch by replacing that one function.
- A flagged image gets a structured `422` (like the quality gate) listing the
  rejected images with a **non-graphic, branded reason** ("This photo cannot be
  used"); we never describe what was detected. No Stripe session, no payment.
- Runs in parallel with face detection per image, so it adds no latency, only
  about one extra Replicate prediction per image in cost.
- Knobs: `UPLOAD_MODERATION` (on by default; `off` for dev),
  `REPLICATE_MODERATION_MODEL`, `REPLICATE_MODERATION_MODEL_VERSION` (optional
  pin), `REPLICATE_MODERATION_NSFW_THRESHOLD` (0.85). On a classifier **error**
  (outage/misconfig) it fails **open** by default (allow + alert to Sentry) so a
  moderation outage never blocks every checkout; set `UPLOAD_MODERATION_FAIL_OPEN=false`
  to fail closed. A positive detection is always blocked regardless.

### Analytics

Three complementary tools, all **disabled by default** and all keeping **PII out of
events** (no email, no image data, no order contents):

- **GA4** (`NEXT_PUBLIC_GA_ID`): the funnel + the `purchase_completed` conversion,
  imported into Google Ads.
- **Microsoft Clarity** (`NEXT_PUBLIC_CLARITY_ID`): session replay + heatmaps, with
  the face photos and email masked (`data-clarity-mask`) so a replay never records a
  customer's face.
- **Plausible** (`NEXT_PUBLIC_ANALYTICS_DOMAIN`, optional `NEXT_PUBLIC_ANALYTICS_SRC`):
  a cookieless alternative; a no-op when unset.

GA4 + Clarity load only **after opt-in via a cookie-consent banner**
(`apps/picturesk-frontend/app/Analytics.js`); until then no analytics cookies are set. The same five
funnel events fire across whichever tool is enabled:

1. `landing_view`: landing page loaded (`app/ai-headshot-generator/page.js`; `/`
   permanent-redirects here).
2. `upload_started`: first photo added (`app/ai-headshot-generator/(funnel)/upload/page.js`).
3. `upload_completed`: all photos pass the gate (`app/ai-headshot-generator/(funnel)/upload/page.js`).
4. `checkout_started`: the pay button is clicked (`app/ai-headshot-generator/(funnel)/payment/page.js`).
5. `purchase_completed`: success page reached for a paid order (`app/success/SuccessView.js`).
   - Optional: `quality_gate_failed`: photos rejected at the gate.

## Identity-based candidate culling

A quality feature in the worker: overgenerate headshots, score each candidate for
identity fidelity against the customer's real selfies, and deliver only the best
ones, so an occasional off-identity seed (a gender flip, dropped beard, or shifted
face shape) is culled instead of shipped, without retraining. Implemented in
`apps/picturesk-backend/scoreIdentity.js` and `selectAndDeliver` in `apps/picturesk-backend/pipeline.js`.
It is **env-gated and OFF by default**.

**How scoring works.** We compute a face EMBEDDING for each candidate and each
selfie once (ArcFace / InsightFace `buffalo_l`), then score a candidate by the MAX
cosine similarity to any selfie. Reference selfie embeddings are memoized, so an
order embeds each image exactly once: O(candidates + selfies). ArcFace is robust to
the pose/lighting/background/attire our prompts deliberately vary, so it scores true
identity, not overall image appearance (which is why CLIP is the wrong tool here).

**The embedding model.** No off-the-shelf face-embedding model on Replicate returns
a usable vector, so we deployed our own tiny CPU Cog, `ammarafridi-max/face-embed`
(source in the scratchpad build dir: `cog.yaml` + `predict.py`). It takes `{ image }`
and returns a 512-dim vector (or `[]` when no face is found -> that candidate scores
low and is culled). It runs on CPU, so a call costs CPU-cents, not a GPU prediction.
The model scales to zero when idle, so the first call of an order cold-boots for a
few minutes; `scoreIdentity.js` polls patiently through that.

**Scoring is parallel.** `selectAndDeliver` scores the FIRST candidate alone (this
absorbs the one cold boot and populates the memoized selfie embeddings), then fans
the rest out with bounded concurrency (`SCORE_CONCURRENCY`, default 6) and persists
the whole scored set in ONE write instead of one-per-candidate. A crash before that
write just re-scores the unscored candidates on the next attempt, which is cheap now
that scoring is parallel. This turns a slow one-at-a-time loop into a few fast waves.

**Overgeneration is culling-gated.** How many candidates we generate is decided in
the worker from whether culling is on, NOT baked into the order:

- **Culling ON:** generate `ceil(deliverCount * OVERGENERATE_FACTOR)` candidates
  (factor default **1.5**), score them all, and deliver the best `deliverCount`.
- **Culling OFF (e.g. prod today):** generate EXACTLY `deliverCount`. No overgeneration,
  no wasted images, since with no scorer culling would keep them all anyway.

`deliverCount` comes from the order's purchased tier (see [Pricing tiers](#pricing-tiers));
legacy pre-tier orders fall back to the `DELIVER_COUNT` / `GENERATE_COUNT` env defaults.

**Enable / tune (worker env):**

- `REPLICATE_FACE_EMBED_MODEL=owner/name:versionHash` turns culling ON (currently
  `ammarafridi-max/face-embed:<hash>`). Unset = OFF, delivery identical to before.
- `OVERGENERATE_FACTOR` (default 1.5): the culling-ON multiplier above. Higher = better
  culling, more generation cost + scoring time. Ignored when culling is off.
- `SCORE_CONCURRENCY` (default 6): how many candidates to identity-score at once.
  Raise for speed (needs Replicate rate/credit headroom), lower if throttled.

**Cost.** Per order with culling ON: `ceil(deliverCount * OVERGENERATE_FACTOR) + selfies`
embedding calls (each a few CPU-seconds, ~cents total) plus the extra generations. Far
cheaper than a pairwise face-verification model, which is why we deploy the embedding Cog.

**Rebuilding the embed Cog:** from the build dir, `cog push r8.im/ammarafridi-max/face-embed`
(needs Docker + `cog`, and `docker login r8.im` with the Replicate API token). The
weights are baked at an absolute path (`root="/src"`) so setup never re-downloads at
runtime -- do not remove that or the model fails to boot on Replicate.

The API already serves the culled `deliveredImageUrls` to customers (`toPublicOrder`
in `apps/picturesk-backend/server.js`, with a fallback to the full set for older orders), and with
culling off `deliveredImageUrls` still equals every generated image, so nothing else
changes when switching the feature on or off.

## Identity lock (face swap)

Culling picks the closest-matching shots, but it can't fix the face itself: ArcFace
identity is invariant to expression and hairstyle, so a shot with the wrong face
SHAPE, longer hair, or an invented teeth-smile still scores as "them" and ships.
The face-swap step fixes that by swapping the customer's REAL face onto each
delivered headshot -- the generated image keeps the pose, outfit, lighting and
background; only the face is replaced, with the customer's true geometry.

Implemented in `apps/picturesk-backend/swapFace.js` (+ `.fake.js`), applied in `selectAndDeliver`
(`apps/picturesk-backend/pipeline.js`) AFTER culling: it swaps the real face onto the selected
`deliverN` shots, persisting each to `swappedImageUrls` (resumable, per slot), then
points `deliveredImageUrls` at the swapped set. The source face is the first
uploaded selfie. A swap that can't find a face in a shot ships that shot un-swapped
rather than failing the order. **Env-gated and OFF by default.**

**Enable:** `REPLICATE_FACE_SWAP_MODEL=owner/name:versionHash` (currently
`cdingram/face-swap`). Unset = OFF, delivery unchanged. ~8s + a few GPU-cents per
image, so ~`DELIVER_COUNT` swaps per order.

**Note:** with swap ON, identity is guaranteed by the swap, so the embedding cull
matters less (it then mainly picks the best-composed shots). If swap proves reliable
you could lower `GENERATE_COUNT`/turn culling off to save cost. Delivered images are
still temporary `replicate.delivery` URLs (pre-existing) -- persisting the final
(swapped) set to R2 is a recommended separate hardening.

## Generation backend: LoRA vs PuLID

The worker has two interchangeable generation backends, chosen by `GENERATION_BACKEND`
(default `lora`). Both implement the same client interface
(`startTraining`/`pollTraining`/`startGeneration`/`pollGeneration`), so the pipeline
and its idempotency/resume guarantees are identical across them.

- **`lora`** (`replicateClient.js`): the original path. Per-user LoRA training on the
  selfies, then generation from the trained model, with optional culling + face swap.
  Accurate identity FEATURES, but the base generation drifts on face SHAPE, and
  training is the source of most cost/latency/failure.
- **`pulid`** (`replicateClient.pulid.js`): **no training.** Identity comes from a
  single reference selfie fed to `bytedance/flux-pulid` at generation time, which
  fixes face SHAPE (what LoRA + swap could not) and deletes the train/cull/swap
  machinery. ~$0.02/image, minutes not ~25, and it honors a negative prompt so the
  invented-teeth bug is suppressed.

Adapter trick: PuLID has nothing to train, so its client makes "training" a no-op
that carries the reference-image URL forward through the pipeline's
`trainedModelVersion` slot; `startGeneration(ref, prompt)` then uses it as PuLID's
`main_face_image`. In PuLID mode the trigger word is dropped from the prompt
(identity is from the image, not a trained token), and culling + swap are forced off.

Because PuLID re-synthesizes the face (rather than pasting it like the swap), it
needs the prompt to hold the beard and expression, or it drifts to a generic short
beard and FLUX's toothy grin. Three things keep it faithful:

- **Facial hair**: `buildSubject` names it from the customer's `facialHair` choice;
  when that is blank, the worker infers it from the reference selfie with a vision
  model (`classifyFacialHair.js`, Qwen2-VL) and stores `derivedFacialHair`, so the
  prompt says e.g. "with a full beard".
- **Expression**: the PuLID subject appends "a calm, subtle closed-mouth expression"
  (and the client carries a teeth negative prompt) to beat the grin prior.
- **`id_weight` 1.2** (default): 1.0 drifted; ~1.1-1.3 holds identity + face shape.

**Enable:** `GENERATION_BACKEND=pulid` on the worker. Tune with `PULID_ID_WEIGHT`,
`PULID_MODEL`, `PULID_VISION_MODEL`. Reference selfie = the first uploaded photo (the
gate guarantees a face); a clearer frontal reference improves results, so rejecting
sunglasses/occluded uploads at the gate is a worthwhile follow-up.

## Delivered-image durability

Generation, face swap, and enhancement all return **`replicate.delivery` URLs**, and
Replicate garbage-collects prediction outputs within about an hour. If we served those
directly, a customer opening the delivery email an hour later (or any download after
that) would hit a `NoSuchKey` / "file not found" error for headshots they paid for.

So the worker **persists the final delivered set into our own R2 bucket** at delivery
time (`persistImage`, keys `deliveries/<orderId>/<i>`), and points `deliveredImageUrls`
at those permanent URLs. It is the last step of `selectAndDeliver`, after
select -> swap -> enhance, and it is **resumable per slot** via `persistedImageUrls`
(same shape as `swappedImageUrls` / `enhancedImageUrls`): a crash mid-copy re-copies
only the missing slots, never a done one. The results page, the download endpoints, and
the delivery email all reference these R2 URLs, so they never expire. Deleting an order
cleans them up (they resolve to our bucket).

ON by default (`PERSIST_DELIVERED=on`); requires R2, which the worker already needs.
Note this does not recover orders delivered BEFORE this shipped, whose upstream URLs
have already expired; it protects every order from here on.

## Deferred: legal and compliance (revisit before scaling)

We are launching internationally and training models on customers' **faces**, so
these carry real legal weight. They are known and deliberately deferred, not
resolved. Get a lawyer to review the privacy policy + terms before scaling ad spend.

- **Cookie consent withdrawal.** There is an opt-in banner gating GA4 + Clarity
  (`apps/picturesk-frontend/app/Analytics.js`), but no easy "withdraw" path. GDPR wants withdrawing
  to be as easy as giving; today changing the choice means clearing site data. Add a
  "Cookie choices" footer link that reopens the banner.
- **Governing law / jurisdiction.** Still a TODO in the terms
  (`apps/picturesk-frontend/data/legal.js`); it currently says the jurisdiction "will be confirmed".
- **Data retention / deletion.** No automatic deletion runs: uploaded selfies,
  training zips, and delivered images persist in R2 until manually removed. The
  privacy policy has no concrete retention schedule. Define and (ideally) enforce one.
- **Biometric / special-category data.** Training on faces can trigger biometric
  regimes (Illinois BIPA, EU GDPR Art. 9) that require explicit consent and a written
  retention/destruction policy. Not yet addressed.
- **Lawyer review.** The privacy policy and terms were written to match how the
  product actually works, but have not had a legal review.

## Conventions

- JavaScript + ESM. No TypeScript; shared shapes use JSDoc typedefs.
- pnpm workspaces.
- No em dashes in user-facing copy.
- Before any design or UI work, read [BRAND.md](./BRAND.md).
