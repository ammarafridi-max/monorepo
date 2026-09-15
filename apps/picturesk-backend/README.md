# picturesk-backend

The backend behind Picturesk.ai. One package, two entrypoints, deployed as two
Fly apps from one image:

- `src/server.js` (`picturesk-api`) — presigned uploads, the photo gate, Stripe
  Checkout and webhook, order creation, delivery downloads, the admin API, and the
  blog, blog-tag and affiliate routes.
- `src/worker.js` (`picturesk-worker`) — the BullMQ consumer that drives an order
  PAID -> TRAINING -> GENERATING -> DELIVERED and emails the results.

This is where the money-in path lives. `POST /webhooks/stripe` is the idempotency
boundary: one atomic write (AWAITING_PAYMENT -> PAID) and one enqueue, keyed on
`stripeSessionId`, mounted before `express.json()` because signature verification
needs the raw body.

## Run

```sh
pnpm dev          # both entrypoints under concurrently
pnpm dev:server   # HTTP only
pnpm dev:worker   # queue consumer only
pnpm test         # node --test
```

Dev loads `.env.development`. Keep `REDIS_URL` pointed at a local Redis: a local
worker drains whatever queue it is given, and `MONGODB_URI` points at the shared
database. Set `USE_FAKE_REPLICATE=1` to exercise the pipeline with no Replicate
spend, no delivery email and no refund.

## Where things are

See `CLAUDE.md` in this directory for the full map: the state machine, what is
idempotent and why, how the admin subsystem is wired to the shared auth domain,
and which storage each kind of image uses (Cloudinary for blog covers, R2 for
customer photos, training zips and delivered headshots).
