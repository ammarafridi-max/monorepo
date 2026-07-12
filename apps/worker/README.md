# @picturesk/worker

The BullMQ consumer of the `order-pipeline` queue, built in **Phase 1 (walking
skeleton)** and made real in **Phase 3 (real Replicate)**.

This is the slow-external-job side: it drives an order through TRAINING and
GENERATING via Replicate. It must be safe to retry: re-reading order state from
MongoDB and never double-running a training or generation.

As of Phase 3 it makes real Replicate calls. `replicateClient.js` wraps the
Replicate HTTP API (bounded timeout + retry); `index.js` runs the resumable,
per-stage-idempotent processor. See the root `README.md` "Phase 3" section for
how to run it end to end.
