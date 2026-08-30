# picturesk-worker

## What this is

The BullMQ consumer behind Picturesk.ai, an AI headshot generator. It drains the
order-pipeline queue and drives an order PAID -> TRAINING -> GENERATING ->
DELIVERED, calling Replicate to fine-tune a model on the customer's face and
generate the headshots, then emailing the results.

## Core design principle

**Money in, then a slow external job we don't control. Never lose or double-run
an order.**

The customer has already paid before this app runs, so every stage is resumable
and per-stage idempotent: a restart safely reattaches rather than re-running a
training or a generation. On failure the order moves to FAILED and, if the
customer paid, is refunded exactly once (receipt-before-acting via `refundedAt`
plus a Stripe idempotency key). Concurrency is 1 in code, one order at a time.

The resumable logic lives in `pipeline.js`; the Replicate client, training-zip
builder, delivery email, and refund are injected. `USE_FAKE_REPLICATE=1` drives
the fake client. `GENERATION_BACKEND` selects `lora` (per-user LoRA training) or
`pulid` (no training, identity from a reference selfie).

## Contracts

`@travel-suite/picturesk-shared` holds the order state machine, the `Order`
model, and `QUEUE_NAMES`. Never redefine a state or a queue name locally.

## Stack and conventions

- JavaScript, ESM everywhere. No TypeScript. JSDoc typedefs, not TS types.
- MongoDB via Mongoose. Redis + BullMQ for the queue. Deploy target Fly.io.
- No em dashes in any user-facing copy.
