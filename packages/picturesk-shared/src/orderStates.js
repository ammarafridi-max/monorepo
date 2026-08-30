/**
 * Order lifecycle contract.
 *
 * This is the single source of truth for what states an order can be in and how
 * it may move between them. Every service (api, worker, web) imports these so
 * they can never disagree about the shape of an order's lifecycle.
 *
 * Design principle: money in, then a slow external job we don't control. The
 * state machine exists so we never lose or double-run an order.
 */

/**
 * The set of valid order states, as a frozen string enum.
 * @readonly
 */
export const ORDER_STATES = Object.freeze({
  AWAITING_PAYMENT: 'AWAITING_PAYMENT',
  PAID: 'PAID',
  TRAINING: 'TRAINING',
  GENERATING: 'GENERATING',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
});

/**
 * Allowed transitions: state -> array of states it may move to next.
 *
 * Happy path (select, upload, then pay): the order is created at checkout already
 * carrying the selections AND the uploaded images, so payment is the last step:
 *   AWAITING_PAYMENT -> PAID -> TRAINING -> GENERATING -> DELIVERED
 *
 * PAID is the webhook's idempotency checkpoint (the atomic AWAITING_PAYMENT -> PAID
 * update happens exactly once) and is where the pipeline job is enqueued. The
 * worker then moves PAID -> TRAINING.
 *
 * Every non-terminal state may also fail. DELIVERED and FAILED are terminal.
 * @readonly
 * @type {Readonly<Record<string, string[]>>}
 */
export const ORDER_TRANSITIONS = Object.freeze({
  [ORDER_STATES.AWAITING_PAYMENT]: [ORDER_STATES.PAID, ORDER_STATES.FAILED],
  [ORDER_STATES.PAID]: [ORDER_STATES.TRAINING, ORDER_STATES.FAILED],
  [ORDER_STATES.TRAINING]: [ORDER_STATES.GENERATING, ORDER_STATES.FAILED],
  [ORDER_STATES.GENERATING]: [ORDER_STATES.DELIVERED, ORDER_STATES.FAILED],
  [ORDER_STATES.DELIVERED]: [],
  [ORDER_STATES.FAILED]: [],
});

/**
 * Pure contract guard: is a transition from `from` to `to` allowed?
 *
 * No I/O, no side effects. This validates the shape of a transition only; it is
 * not business logic and it does not touch the database.
 *
 * @param {string} from - the current state
 * @param {string} to - the proposed next state
 * @returns {boolean} true if the transition is allowed by ORDER_TRANSITIONS
 */
export function canTransition(from, to) {
  const allowed = ORDER_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}
