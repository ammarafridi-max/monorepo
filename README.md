# Headliner

AI headshot generator: upload selfies, pay once (~$35), we fine-tune a model on
your face via Replicate, generate professional headshots, and email the results.

Core design principle: **money in, then a slow external job we don't control;
never lose or double-run an order.** See [CLAUDE.md](./CLAUDE.md) for the full
design and build plan.

## Layout

- `apps/web` - Next.js frontend: upload, checkout kickoff, live status + results (Phase 4).
- `apps/api` - Express service: real Stripe Checkout + webhook that drive the pipeline (Phase 2).
- `apps/worker` - BullMQ worker: drives orders through real Replicate training + generation (Phase 3).
- `packages/shared` - shared order contracts, the atomic transition helper, and the Redis connection helper.

## Getting started

```sh
pnpm install
cp .env.example .env   # then fill in values
```

## Running locally

The api and worker **require a running MongoDB and Redis.** Set both in `.env`:

- `MONGODB_URI` - e.g. `mongodb://127.0.0.1:27017/headliner`
- `REDIS_URL` - e.g. `redis://127.0.0.1:6379`

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

3. Create a checkout and open the returned `checkoutUrl` in a browser:

   ```sh
   curl -s -X POST localhost:3001/checkout \
     -H 'content-type: application/json' \
     -d '{"customerEmail":"test@example.com"}'
   # -> { "orderId": "...", "checkoutUrl": "https://checkout.stripe.com/..." }
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
- `REPLICATE_DESTINATION_MODEL` - `your-username/headliner-headshots`; the worker
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

New env (see `.env.example`): R2 storage (`R2_*`), email (`RESEND_API_KEY`,
`EMAIL_FROM`), `WEB_BASE_URL`, and `NEXT_PUBLIC_API_BASE_URL` for the web app.

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
the downloadable results grid. When it hits delivered, the worker emails the
results link exactly once (guarded by `deliveredEmailSentAt`).

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

- **User model:** `users` collection in `@headliner/shared` (`User`), email +
  bcrypt `passwordHash`. Orders gain an optional, nullable `userId`; anonymous
  orders leave it null.
- **Sessions:** a signed JWT (`jose`) in a secure httpOnly cookie, hand-rolled to
  match the repo's minimal style (no NextAuth adapter fighting our Mongoose model).
  Set `AUTH_SECRET` (`openssl rand -hex 32`). The web app reads the same root
  `.env` as the services (loaded in `next.config.mjs`).
- **Pages/routes:** `/signup`, `/login`, `/account`, and a POST `/api/auth/logout`.
- **Linking orders:** a logged-in checkout links the new order to the account
  (only when the order email matches the session, so a guessed id cannot claim
  someone else's order). Signup and login also back-link past anonymous orders
  that share the account email.

## Upload quality gate

Bad photos are worse than a failed order: they train a model and then "succeed"
into a DELIVERED order, so the FAILED auto-refund never fires and the customer
paid for garbage. So we reject bad input BEFORE the Stripe session is created,
not after training.

Two layers, and the server one is the real gate (same lesson as server-owned
pricing: client validation can be bypassed by calling `/checkout` directly):

- **Client (apps/web):** on file drop, the browser's `FaceDetector` runs per photo
  and disables the CTA with a short reason on any bad thumbnail ("No clear face",
  "More than one person", "Face too small, get closer"). Fast feedback only. If a
  browser has no `FaceDetector`, the client defers and the server still checks.
- **Server (apps/api, `POST /checkout`):** re-runs detection on every uploaded
  image and returns `422` with per-image reasons instead of creating the Stripe
  session if any fail. No session means no payment. The client shows those
  reasons and re-disables the CTA. Detection runs on Replicate (reusing
  `REPLICATE_API_TOKEN`, no extra cloud account): `ultralytics/yolov8s-worldv2`
  on the "person" class. Tradeoff vs a true face-landmark detector: person
  detection reliably catches the important cases (zero subjects, or more than
  one), but the "too small" rule becomes a subject-box-size proxy, so a full-body
  shot with a small face can pass server-side. The browser's `FaceDetector`
  applies a true face-size check client-side. `detectFaces` is swappable if you
  later want a dedicated face model.

Rules per image: exactly one clear subject (zero = not a usable photo, two+ =
multiple people), and the subject must span at least `UPLOAD_MIN_FACE_RATIO` of
the frame. Plus the promised `UPLOAD_MIN_PHOTOS`..`UPLOAD_MAX_PHOTOS` count.

Tuning (all env, see `.env.example`): `UPLOAD_MIN_PHOTOS`, `UPLOAD_MAX_PHOTOS`,
`UPLOAD_MIN_FACE_RATIO`, mirrored to the client as `NEXT_PUBLIC_UPLOAD_*`, plus
`REPLICATE_FACE_MODEL_VERSION` / `REPLICATE_FACE_CONF`. The gate is on by default
and fails closed. For local dev without a token wired up, set
`UPLOAD_QUALITY_GATE=off` (this re-opens the pay-for-garbage hole, so dev only).

## Tuning generation (dev)

Output quality is a GENERATING-stage concern (prompt + `lora_scale`), which is
cheap, not a TRAINING one, which is expensive. So you can iterate on quality
against an already-trained model for cents, without retraining and without going
through the order pipeline.

Two levers, both generation-only:

- **Prompt anchoring:** every prompt in `apps/worker/replicateClient.js` leads with
  the trigger word then a `SUBJECT` anchor (e.g. `a bearded man`). Naming the
  subject up front stops the base model's prior from drifting gender or facial
  hair on a weak-identity seed. Edit `SUBJECT` in one place.
- **`GEN_LORA_SCALE`:** LoRA strength (~0.8 to 1.1; higher pulls harder toward the
  trained identity, too high risks artifacts).

Grab a trained model version from a prior order's `replicate.trainedModelVersion`
(e.g. `db.orders.findOne({status:'DELIVERED'}).replicate.trainedModelVersion`),
then run the generate-only script:

```sh
pnpm --filter @headliner/worker tune:gen \
  --version <owner/name:hash> --scale 1.05 --count 3
```

It runs the real generation functions against that version, polls to completion,
prints each image URL, and saves a record under
`apps/worker/scripts/results/`. It never creates an order or touches
Mongo/Redis/Stripe. Compare a few scales, and once a prompt set + scale looks
good it is already promoted: `PROMPTS` is shared with the worker, and
`GEN_LORA_SCALE` becomes the default for real orders.

## Conventions

- JavaScript + ESM. No TypeScript; shared shapes use JSDoc typedefs.
- pnpm workspaces.
- No em dashes in user-facing copy.
- Before any design or UI work, read [BRAND.md](./BRAND.md).
