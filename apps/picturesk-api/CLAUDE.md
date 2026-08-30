# picturesk-api

## What this is

The Express service behind Picturesk.ai, an AI headshot generator. A customer
uploads selfies, pays once via Stripe, we fine-tune a model on their face via
Replicate, generate professional headshots, and email the results. This app owns
presigned uploads, the photo gate, Stripe Checkout + webhook, order creation, the
delivery downloads, and the admin API.

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

## Contracts

`@travel-suite/picturesk-shared` is the single source of truth so no two services
can disagree about what an order is:

- `orderStates.js` - the `ORDER_STATES` enum, the `ORDER_TRANSITIONS` map, and
  the pure `canTransition(from, to)` guard.
- `orderModel.js` - the Mongoose `Order` schema/model. `stripeSessionId` is the
  idempotency anchor (unique + sparse).
- `queue.js` - `QUEUE_NAMES` and the job payload typedef. Names/shapes only.
- `db.js` - `connectMongo(uri)`.

## Staff identity comes from the shared domains

Admin auth and staff CRUD are `@travel-suite/auth` and `@travel-suite/admin-users`,
the same packages the travel brands use. Wiring lives in `admin/index.js`. That
means the session cookie is `jwt`, the model registers as `admin-user`
(collection `admin-users`), and the password field is `password`, hashed by a
schema pre-save hook. Do not reintroduce a local copy of any of this.

Picturesk-specific parts that stay local: the `ADMIN_TOKEN` break-glass guard
(wrapping the shared `protect`), and `admin/adminData.js` + `admin/adminActions.js`
(the order/stats/customer surface, which is Picturesk's own domain).

The `support` role is read-only staff access. It is a valid role in the shared
enum alongside `admin`, `agent`, and `blog-manager`.

## Stack and conventions

- JavaScript, ESM everywhere. No TypeScript. Shared shapes are documented with
  JSDoc typedefs, not TS types.
- MongoDB via Mongoose. Redis + BullMQ for the queue. Deploy target Fly.io.
- The server owns the price. The client picks a tier id, validated against the
  shared pricing catalog; never trust the client for an amount.
- No em dashes in any user-facing copy.
