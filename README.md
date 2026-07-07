# Headliner

AI headshot generator: upload selfies, pay once (~$35), we fine-tune a model on
your face via Replicate, generate professional headshots, and email the results.

Core design principle: **money in, then a slow external job we don't control;
never lose or double-run an order.** See [CLAUDE.md](./CLAUDE.md) for the full
design and build plan.

## Layout

- `apps/web` - Next.js frontend (Phase 4, placeholder for now).
- `apps/api` - Express service: real Stripe Checkout + webhook that drive the pipeline (Phase 2).
- `apps/worker` - BullMQ worker: drives orders through the pipeline (Phase 1). Real Replicate in Phase 3.
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
GENERATING -> DELIVERED`, about 5 seconds). Replicate is still stubbed with a
sleep until Phase 3. Poll an order to watch it advance:

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

## Conventions

- JavaScript + ESM. No TypeScript; shared shapes use JSDoc typedefs.
- pnpm workspaces.
- No em dashes in user-facing copy.
- Before any design or UI work, read [BRAND.md](./BRAND.md).
