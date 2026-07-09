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
  // Money is in, but we are waiting on the HUMAN to upload their photos. This is
  // NOT a system stall: the stuck-detector must treat it as waiting-on-customer.
  AWAITING_UPLOAD: 'AWAITING_UPLOAD',
  TRAINING: 'TRAINING',
  GENERATING: 'GENERATING',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
});

/**
 * Allowed transitions: state -> array of states it may move to next.
 *
 * Happy path (selection-first, pay before upload):
 *   AWAITING_PAYMENT -> PAID -> AWAITING_UPLOAD -> TRAINING -> GENERATING -> DELIVERED
 *
 * Where the boundaries are:
 *   - PAID is the webhook's idempotency checkpoint (the atomic AWAITING_PAYMENT
 *     -> PAID update happens exactly once). The webhook then advances PAID ->
 *     AWAITING_UPLOAD and does NOT enqueue anything.
 *   - AWAITING_UPLOAD -> TRAINING is driven by the customer's gate-passing photo
 *     upload (POST /orders/:id/images), which is also where the pipeline job is
 *     enqueued. So an order only ever enters TRAINING after a paid, valid upload.
 *
 * Every non-terminal state may also fail. DELIVERED and FAILED are terminal.
 * @readonly
 * @type {Readonly<Record<string, string[]>>}
 */
export const ORDER_TRANSITIONS = Object.freeze({
  [ORDER_STATES.AWAITING_PAYMENT]: [ORDER_STATES.PAID, ORDER_STATES.FAILED],
  [ORDER_STATES.PAID]: [ORDER_STATES.AWAITING_UPLOAD, ORDER_STATES.FAILED],
  [ORDER_STATES.AWAITING_UPLOAD]: [ORDER_STATES.TRAINING, ORDER_STATES.FAILED],
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
