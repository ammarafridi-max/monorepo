import { Order } from './orderModel.js';
import { canTransition, ORDER_STATES } from './orderStates.js';


const TIMESTAMP_FIELD_FOR = Object.freeze({
  [ORDER_STATES.PAID]: 'paidAt',
  [ORDER_STATES.TRAINING]: 'trainingStartedAt',
  [ORDER_STATES.GENERATING]: 'generatingStartedAt',
  [ORDER_STATES.DELIVERED]: 'deliveredAt',
  [ORDER_STATES.FAILED]: 'failedAt',
});

export class OrderTransitionConflictError extends Error {
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
