/**
 * The pricing-tier catalog. THE single source of truth for what a customer can
 * buy, imported by BOTH the web (to render the plan cards) and the api (to set
 * the Stripe amount and stamp the order). Keeping it here is the whole point:
 * the price a customer sees can never drift from what we charge or from what the
 * worker delivers.
 *
 * A TIER is a one-time purchase. It differs on three levers (v1): `priceCents`
 * (what Stripe charges), `deliverCount` (how many headshots we deliver), and
 * `priority` (BullMQ queue priority, so higher tiers jump the line). Quality
 * levers (4K upscale, face-swap identity-lock) are deferred to a later phase.
 *
 * `generateCount` is how many candidates the worker generates. With identity
 * culling OFF it equals `deliverCount` (generate exactly what we deliver); if
 * culling is later enabled, a tier can overgenerate by setting it higher.
 *
 * BullMQ priority: LOWER number = HIGHER priority, so premium (1) is pulled off
 * the queue before starter (3).
 */

/**
 * @typedef {Object} Tier
 * @property {string} id            - stable id, stored on the order
 * @property {string} label         - user-facing name (BRAND: no em dashes)
 * @property {number} priceCents    - one-time charge, in integer USD cents
 * @property {number} deliverCount  - headshots delivered
 * @property {number} generateCount - candidates generated (>= deliverCount)
 * @property {number} priority      - BullMQ priority (1 = highest)
 * @property {boolean} [popular]     - render the "Most popular" badge
 */

/** @type {readonly Tier[]} */
export const TIERS = Object.freeze([
  Object.freeze({
    id: 'starter',
    label: 'Starter',
    priceCents: 900,
    deliverCount: 5,
    generateCount: 5,
    priority: 3,
  }),
  Object.freeze({
    id: 'pro',
    label: 'Pro',
    priceCents: 2900,
    deliverCount: 25,
    generateCount: 25,
    priority: 2,
    popular: true,
  }),
  Object.freeze({
    id: 'premium',
    label: 'Premium',
    priceCents: 4900,
    deliverCount: 60,
    generateCount: 60,
    priority: 1,
  }),
]);

/** The tier assumed when a request omits one (keeps old clients working). */
export const DEFAULT_TIER = 'starter';

const TIERS_BY_ID = Object.freeze(Object.fromEntries(TIERS.map((t) => [t.id, t])));

/** Is `id` a real tier? (Used by the api to validate /checkout.) */
export function isValidTier(id) {
  return Object.prototype.hasOwnProperty.call(TIERS_BY_ID, id);
}

/**
 * The tier for `id`, or the DEFAULT_TIER when `id` is missing/unknown. Callers
 * that must reject bad input should gate on isValidTier() first; this never
 * throws so the worker can always resolve a tier for an old order.
 * @returns {Tier}
 */
export function getTier(id) {
  return TIERS_BY_ID[id] || TIERS_BY_ID[DEFAULT_TIER];
}
