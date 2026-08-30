# Picturesk.ai

## What this is

An AI headshot generator. A customer uploads selfies, pays once (~$35 via
Stripe), we fine-tune a model on their face via Replicate, generate professional
headshots, and email the results.

## Core design principle

**Money in, then a slow external job we don't control. Never lose or
double-run an order.**

Payment succeeds, then a long, failure-prone job (Replicate training +
generation) runs outside our control. Everything is built around that risk: an
order is a durable record in MongoDB, moved through an explicit state machine,
processed by an idempotent worker. We would rather stall an order and retry than
lose one or run it twice.

## Monorepo layout

```
apps/
  web       Next.js frontend (upload, checkout kickoff, results). Phase 4.
  api       Express service: Stripe Checkout + webhook, order creation. Phase 1-2.
  worker    BullMQ consumer: drives training/generation via Replicate. Phase 1-3.
packages/
  shared    The contracts every service imports. THE Phase 0 deliverable.
```

`@picturesk/shared` is the single source of truth so no two services can
disagree about what an order is:

- `orderStates.js` - the `ORDER_STATES` enum, the `ORDER_TRANSITIONS` map, and
  the pure `canTransition(from, to)` guard.
- `orderModel.js` - the Mongoose `Order` schema/model. `stripeSessionId` is the
  idempotency anchor (unique + sparse).
- `queue.js` - `QUEUE_NAMES` and the job payload typedef. Names/shapes only.
- `db.js` - `connectMongo(uri)`.

## Phased build plan

We build the money and failure paths BEFORE the UI.

- **Phase 0 - Contracts** (current): monorepo skeleton + `@picturesk/shared`.
  No business logic, routes, Stripe/Replicate calls, workers, or UI.
- **Phase 1 - Walking skeleton**: api + worker wired to Mongo and the queue,
  moving a fake order end to end through the state machine.
- **Phase 2 - Real Stripe**: Checkout session creation and webhook handling.
  The webhook is the idempotency boundary, keyed on `stripeSessionId`.
- **Phase 3 - Real Replicate**: real training + generation in the worker, made
  safe to retry (never double-run a training or generation).
- **Phase 4 - Delivery + UI**: email the results; build the Next.js frontend.
- **Phase 5 - Hardening**: retries, timeouts, dead-letter handling, monitoring,
  margin tracking (`computeCostCents`).

## HARD RULE

**Before doing ANY UI, design, styling, layout, or user-facing copy work, you
MUST read `BRAND.md` and follow it. Never design without consulting `BRAND.md`
first.**

## Stack and conventions

- JavaScript, ESM everywhere (`"type": "module"`). No TypeScript.
- Shared shapes are documented with JSDoc typedefs, not TS types.
- pnpm workspaces. Apps depend on `@picturesk/shared` via `workspace:*`.
- MongoDB via Mongoose. Redis + BullMQ for the queue. Deploy target Fly.io.
- No em dashes in any user-facing copy.

## SEO metadata rules

Whenever you write or edit a page `<title>` or meta description (including
`buildMetadata` calls in `apps/web/lib/schema.js` and per-page `metadata` exports):

- **Title: at most 60 characters, spaces included.** Strictly 60, never more.
- **Meta description: at most 160 characters, spaces included.** Strictly 160, never more.
- Both must contain the page's primary keyword. The home page's primary keyword is
  **"AI Headshot Generator"**.
- No em dashes (already required for all user-facing copy).

Always count the characters (spaces included) and confirm the limits before finishing.
