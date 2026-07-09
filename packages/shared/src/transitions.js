import { Order } from './orderModel.js';
import { canTransition, ORDER_STATES } from './orderStates.js';

/**
 * Order state transitions.
 *
 * This is the ONLY sanctioned way to change an order's status. It combines the
 * pure canTransition() guard with an atomic, conditional database update so two
 * workers can never both advance the same order. It is the enforcement point for
 * the core principle: never lose or double-run an order.
 */

/**
 * Which timestamp field to stamp when an order enters a given state.
 * @type {Readonly<Record<string, string>>}
 */
const TIMESTAMP_FIELD_FOR = Object.freeze({
  [ORDER_STATES.PAID]: 'paidAt',
  [ORDER_STATES.AWAITING_UPLOAD]: 'awaitingUploadAt',
  [ORDER_STATES.TRAINING]: 'trainingStartedAt',
  [ORDER_STATES.GENERATING]: 'generatingStartedAt',
  [ORDER_STATES.DELIVERED]: 'deliveredAt',
  [ORDER_STATES.FAILED]: 'failedAt',
});

/**
 * Thrown when the atomic update matches no document, i.e. the order was not in
 * the expected `from` state. That means someone else already moved it or it lost
 * a race. Callers must NOT blindly retry: the order is simply not where they
 * thought it was.
 */
export class OrderTransitionConflictError extends Error {
  /**
   * @param {string} orderId
   * @param {string} from
   * @param {string} to
   */
  constructor(orderId, from, to) {
    super(
      `[order ${orderId}] conflict: expected status ${from} to move to ${to}, ` +
        `but the order was not in ${from} (already moved or lost a race)`
    );
    this.name = 'OrderTransitionConflictError';
    this.orderId = String(orderId);
    this.from = from;
    this.to = to;
  }
}

/**
 * Atomically move an order from one state to another.
 *
 * The guard is applied first (illegal transitions throw immediately). The state
 * change itself is a single conditional update, NOT a read-then-write: the query
 * matches only if the order is still in `from`, so concurrent advances of the
 * same order cannot both succeed.
 *
 * @param {string} orderId - the Order _id
 * @param {string} from - the state the order must currently be in
 * @param {string} to - the state to move it to
 * @param {Object} [extraFields={}] - additional $set fields (e.g. amountPaidCents, error)
 * @returns {Promise<import('mongoose').Document>} the updated order document
 * @throws {Error} if the transition is not allowed by ORDER_TRANSITIONS
 * @throws {OrderTransitionConflictError} if no order was in state `from`
 */
export async function transitionOrder(orderId, from, to, extraFields = {}) {
  if (!canTransition(from, to)) {
    throw new Error(
      `[order ${orderId}] illegal transition ${from} -> ${to} (not allowed by ORDER_TRANSITIONS)`
    );
  }

  const $set = { status: to };
  const timestampField = TIMESTAMP_FIELD_FOR[to];
  if (timestampField) $set[timestampField] = new Date();
  Object.assign($set, extraFields);

  const updated = await Order.findOneAndUpdate(
    { _id: orderId, status: from },
    { $set },
    { new: true }
  );

  if (!updated) {
    throw new OrderTransitionConflictError(orderId, from, to);
  }

  console.log(`[order ${orderId}] ${from} -> ${to}`);
  return updated;
}
