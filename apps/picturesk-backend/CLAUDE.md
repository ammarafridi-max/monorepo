# picturesk-backend

## What this is

The backend behind Picturesk.ai, an AI headshot generator. A customer uploads
selfies, pays once via Stripe, we fine-tune a model on their face via Replicate,
generate professional headshots, and email the results.

One package, **two entrypoints**, deployed as two Fly apps from one image:

- `src/server.js` (Fly app `picturesk-api`) — presigned uploads, the photo gate,
  Stripe Checkout + webhook, order creation, delivery downloads, and the admin API.
- `src/worker.js` (Fly app `picturesk-worker`) — the BullMQ consumer that drives
  an order PAID -> TRAINING -> GENERATING -> DELIVERED and emails the results.

They stay separate processes on purpose. The server auto-suspends on idle HTTP
and scales on request load; the worker must run continuously at concurrency 1,
needs more memory to build a training zip, and must not be restarted by a deploy
triggered by a web change. Do not merge them into one process.

`pnpm dev` starts the server only. `pnpm dev:worker` starts the worker;
`pnpm dev:all` runs both under concurrently. Node runs one entry script per
process, so there is no single-command form: `node --watch a.js --watch b.js`
silently runs only `a.js` and passes the rest as argv.

`dev` deliberately does not start the worker. A worker started by reflex on
every dev loop will act on whatever database MONGODB_URI points at, which is
real Replicate spend, real delivery emails, and real refunds.

## Core design principle

**Money in, then a slow external job we don't control. Never lose or double-run
an order.**

Payment succeeds, then a long, failure-prone job (Replicate training +
generation) runs outside our control. Everything is built around that risk: an
order is a durable record in MongoDB, moved through an explicit state machine,
processed by an idempotent worker. We would rather stall an order and retry than
lose one or run it twice.

`POST /webhooks/stripe` is the idempotency boundary: one atomic write
(AWAITING_PAYMENT -> PAID) and one enqueue, keyed on `stripeSessionId`. It is
mounted BEFORE `express.json()` and uses `express.raw` because signature
verification needs the raw body. Do not move it behind the JSON parser.

In the worker, every stage is resumable and per-stage idempotent: a restart
reattaches rather than re-running a training or generation. On failure the order
moves to FAILED and, if the customer paid, is refunded exactly once
(receipt-before-acting via `refundedAt` plus a Stripe idempotency key).

## Layout

```
src/server.js        HTTP entrypoint
src/worker.js        queue entrypoint
src/instrument.js    Sentry bootstrap, imported FIRST by both
src/admin/           admin auth wiring, order actions, read-only data routes
src/pipeline/        the worker's stages: Replicate clients, scoring, swap,
                     enhance, persist, refund. `.fake.js` variants drive
                     USE_FAKE_REPLICATE=1.
```

`GENERATION_BACKEND` selects `lora` (per-user training) or `pulid` (no training,
identity from a reference selfie).

## Staff identity comes from the shared domains

Admin auth and staff CRUD are `@travel-suite/auth` and `@travel-suite/admin-users`,
the same packages the travel brands use. Wiring lives in `src/admin/index.js`.
That means the session cookie is `jwt`, the model registers as `admin-user`
(collection `admin-users`), and the password field is `password`, hashed by a
schema pre-save hook. Do not reintroduce a local copy of any of this.

Picturesk-specific parts that stay local: the `ADMIN_TOKEN` break-glass guard
(wrapping the shared `protect`), and `src/admin/adminData.js` +
`src/admin/adminActions.js` (the order/stats/customer surface).

The `support` role is read-only staff access. It is a valid role in the shared
enum alongside `admin`, `agent`, and `blog-manager`.

The admin routes are mounted twice: unprefixed and under `/api`. The shared
frontend admin services call `/api/*`; the ADMIN_TOKEN scripts and the Postman
collection still use the unprefixed paths.

## Contracts

`@travel-suite/picturesk-shared` is the single source of truth so the two
entrypoints can never disagree about what an order is:

- `orderStates.js` - the `ORDER_STATES` enum, `ORDER_TRANSITIONS`, and the pure
  `canTransition(from, to)` guard.
- `orderModel.js` - the Mongoose `Order` schema/model. `stripeSessionId` is the
  idempotency anchor (unique + sparse).
- `queue.js` - `QUEUE_NAMES` and the job payload typedef.

## Stack and conventions

- JavaScript, ESM everywhere. No TypeScript. JSDoc typedefs, not TS types.
- MongoDB via Mongoose. Redis + BullMQ for the queue. Deploy target Fly.io.
- The server owns the price. The client picks a tier id, validated against the
  shared pricing catalog; never trust the client for an amount.
- No em dashes in any user-facing copy.
