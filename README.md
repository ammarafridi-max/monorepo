# Headliner

AI headshot generator: upload selfies, pay once (~$35), we fine-tune a model on
your face via Replicate, generate professional headshots, and email the results.

Core design principle: **money in, then a slow external job we don't control;
never lose or double-run an order.** See [CLAUDE.md](./CLAUDE.md) for the full
design and build plan.

## Layout

- `apps/web` - Next.js frontend (Phase 4, placeholder for now).
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

## Conventions

- JavaScript + ESM. No TypeScript; shared shapes use JSDoc typedefs.
- pnpm workspaces.
- No em dashes in user-facing copy.
- Before any design or UI work, read [BRAND.md](./BRAND.md).
