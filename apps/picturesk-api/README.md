# @travel-suite/picturesk-api

Placeholder. The Express service (Stripe Checkout creation, Stripe webhook
handling, order creation) is built starting in **Phase 1 (walking skeleton)**
and made real in **Phase 2 (real Stripe)**.

This is where the money-in path lives. The Stripe webhook is the idempotency
boundary: it creates/advances an order keyed on `stripeSessionId`.

Nothing is implemented yet.
