/**
 * The pricing-tier catalog. THE single source of truth for what a customer can
 * buy, imported by BOTH the web (to render the plan cards) and the api (to set
 * the Stripe amount and stamp the order). Keeping it here is the whole point:
 * the price a customer sees can never drift from what we charge or from what the
 * worker delivers.
 *
 * A TIER is a one-time purchase. It differs on five levers: `priceCents` (what
 * Stripe charges), `deliverCount` (how many headshots we deliver), `priority`
 * (BullMQ queue priority, so higher tiers jump the line), and how much of the
 * catalogue it unlocks: `attireCount` and `lookCount`, the maximum number of
 * outfits and backgrounds the customer may select. `null` means no limit.
 * Quality levers (4K upscale, face-swap identity-lock) are deferred.
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
 * @property {string} product       - product id from products.js
 * @property {string} label         - user-facing name (BRAND: no em dashes)
 * @property {number} priceCents    - one-time charge, in integer USD cents
 * @property {number} deliverCount  - headshots delivered
 * @property {number} generateCount - candidates generated (>= deliverCount)
 * @property {number} priority      - BullMQ priority (1 = highest)
 * @property {number|null} attireCount - max outfits selectable, null = all
 * @property {number|null} lookCount   - max backgrounds selectable, null = all
 * @property {boolean} [popular]     - render the "Most popular" badge
 */

import { PRODUCTS, DEFAULT_PRODUCT, productOf } from './products.js';

/** @type {readonly Tier[]} */
export const TIERS = Object.freeze([
  Object.freeze({
    id: 'free',
    product: PRODUCTS.HEADSHOTS,
    label: 'Free',
    priceCents: 0,
    deliverCount: 3,
    generateCount: 3,
    priority: 4,
    attireCount: 1,
    lookCount: 1,
  }),
  Object.freeze({
    id: 'starter',
    product: PRODUCTS.HEADSHOTS,
    label: 'Starter',
    priceCents: 900,
    deliverCount: 5,
    generateCount: 5,
    priority: 3,
    attireCount: 1,
    lookCount: 2,
  }),
  Object.freeze({
    id: 'pro',
    product: PRODUCTS.HEADSHOTS,
    label: 'Pro',
    priceCents: 2900,
    deliverCount: 25,
    generateCount: 25,
    priority: 2,
    attireCount: 3,
    lookCount: 4,
    popular: true,
  }),
  Object.freeze({
    id: 'premium',
    product: PRODUCTS.HEADSHOTS,
    label: 'Premium',
    priceCents: 4900,
    deliverCount: 60,
    generateCount: 60,
    priority: 1,
    attireCount: null,
    lookCount: null,
  }),
  Object.freeze({
    id: 'dating_free',
    product: PRODUCTS.DATING,
    label: 'Free',
    priceCents: 0,
    deliverCount: 4,
    generateCount: 4,
    priority: 4,
    attireCount: 1,
    lookCount: 1,
  }),
  Object.freeze({
    id: 'dating_starter',
    product: PRODUCTS.DATING,
    label: 'Starter',
    priceCents: 1900,
    deliverCount: 20,
    generateCount: 20,
    priority: 3,
    attireCount: 2,
    lookCount: 3,
  }),
  Object.freeze({
    id: 'dating_pro',
    product: PRODUCTS.DATING,
    label: 'Pro',
    priceCents: 3900,
    deliverCount: 60,
    generateCount: 60,
    priority: 2,
    attireCount: 4,
    lookCount: 6,
    popular: true,
  }),
  Object.freeze({
    id: 'dating_premium',
    product: PRODUCTS.DATING,
    label: 'Premium',
    priceCents: 5900,
    deliverCount: 120,
    generateCount: 120,
    priority: 1,
    attireCount: null,
    lookCount: null,
  }),
]);

/** A free tier: one per account, no Stripe session, trains the model like any other. */
export function isFreeTier(tier) {
  return Boolean(tier) && tier.priceCents === 0;
}

/** The tiers sold for one product, in display order (free first). */
export function tiersFor(product) {
  const id = productOf(product);
  return TIERS.filter((t) => t.product === id);
}

/** The paid tiers of a product, for pricing cards that lead with the price. */
export function paidTiersFor(product) {
  return tiersFor(product).filter((t) => !isFreeTier(t));
}

/** The cheapest PAID tier of a product, in whole dollars, for "from $X" copy. */
export function fromPriceFor(product) {
  return Math.round(Math.min(...paidTiersFor(product).map((t) => t.priceCents)) / 100);
}

/** The tier assumed when a request omits one (keeps old clients working). */
export const DEFAULT_TIER = 'starter';

/** The default tier for a product (what the select step preselects). */
export function defaultTierFor(product) {
  return productOf(product) === DEFAULT_PRODUCT ? DEFAULT_TIER : `${productOf(product)}_starter`;
}

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
