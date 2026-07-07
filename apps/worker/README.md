# @headliner/worker

Placeholder. The BullMQ consumer of the `order-pipeline` queue is built starting
in **Phase 1 (walking skeleton)** and made real in **Phase 3 (real Replicate)**.

This is the slow-external-job side: it drives an order through TRAINING and
GENERATING via Replicate. It must be safe to retry: re-reading order state from
MongoDB and never double-running a training or generation.

Nothing is implemented yet.
