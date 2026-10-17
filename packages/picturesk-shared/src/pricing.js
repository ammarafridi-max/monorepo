

import { PRODUCTS, DEFAULT_PRODUCT, productOf } from './products.js';

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

export function isFreeTier(tier) {
  return Boolean(tier) && tier.priceCents === 0;
}

export function tiersFor(product) {
  const id = productOf(product);
  return TIERS.filter((t) => t.product === id);
}

export function paidTiersFor(product) {
  return tiersFor(product).filter((t) => !isFreeTier(t));
}

export function fromPriceFor(product) {
  return Math.round(Math.min(...paidTiersFor(product).map((t) => t.priceCents)) / 100);
}

export const DEFAULT_TIER = 'starter';

export function defaultTierFor(product) {
  return productOf(product) === DEFAULT_PRODUCT ? DEFAULT_TIER : `${productOf(product)}_starter`;
}

const TIERS_BY_ID = Object.freeze(Object.fromEntries(TIERS.map((t) => [t.id, t])));

export function isValidTier(id) {
  return Object.prototype.hasOwnProperty.call(TIERS_BY_ID, id);
}

export function getTier(id) {
  return TIERS_BY_ID[id] || TIERS_BY_ID[DEFAULT_TIER];
}
