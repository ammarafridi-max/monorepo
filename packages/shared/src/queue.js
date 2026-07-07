/**
 * Queue contract.
 *
 * Phase 0: names and payload shapes only. We do NOT instantiate a Queue or
 * Worker here. The worker app (Phase 1+) will construct BullMQ instances using
 * these names so producer and consumer can never drift apart.
 */

/**
 * Canonical BullMQ queue names.
 * @readonly
 */
export const QUEUE_NAMES = Object.freeze({
  ORDER_PIPELINE: 'order-pipeline',
});

/**
 * Job payload for the order pipeline queue. The job carries only the order id;
 * all order state lives in MongoDB, so the worker re-reads it and never trusts
 * stale data from the job.
 *
 * @typedef {Object} OrderPipelineJob
 * @property {string} orderId - the Order document _id, as a string
 */

export {};
