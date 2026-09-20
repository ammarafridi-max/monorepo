// Cross-step funnel state, held CLIENT-SIDE in localStorage until checkout.
//
// The flow is select -> upload -> pay, so we carry the selections, email, AND the
// uploaded photo URLs (photos are uploaded direct-to-R2 on the upload step, then
// their URLs ride along to the pay step). The order is created only at checkout
// (the pay step), so we never litter the database with abandoned drafts.
// localStorage is the right home for this: it is the real app (not an artifact),
// and the data is catalog ids, an email, and public R2 URLs. Cleared once the
// order is created.

import {
  isValidLook,
  isValidAttire,
  isValidGender,
  isValidAgeRange,
  isValidRace,
  isValidFacialHair,
  isValidBuild,
} from '@travel-suite/picturesk-shared/catalog';
import { isValidTier, getTier } from '@travel-suite/picturesk-shared/pricing';
import { PRODUCTS, productOf, productConfig, funnelPaths } from './products';

// One key per product so a half-finished headshot order never bleeds into a
// dating one. The headshot key keeps its original name for existing visitors.
const keyFor = (product) =>
  productOf(product) === PRODUCTS.HEADSHOTS ? 'picturesk.generator' : `picturesk.generator.${productOf(product)}`;

// The funnel preselects Pro (the plan the pricing cards badge as most popular). The
// server's DEFAULT_TIER stays Starter so a request that omits a tier is never
// charged more than the cheapest plan.
export const FUNNEL_DEFAULT_TIER = 'pro';

const emptyFor = (product) => ({
  looks: [],
  attire: [],
  gender: '',
  ageRange: '',
  race: '',
  facialHair: '',
  build: '',
  images: [],
  // Set when the customer chose to reuse the model from an earlier order instead
  // of uploading; images stays empty in that case.
  reuseFromOrderId: '',
  tier: productConfig(product).defaultTier,
});

/**
 * Read the current funnel state. Safe on the server (returns empty).
 *
 * Every catalog-backed id is validated against the CURRENT catalog and dropped if
 * unknown. This matters because the state lives in the customer's browser across
 * catalog changes: a stored id that we later rename or remove (e.g. an attire that
 * was dropped in a catalog refresh) would otherwise linger. It has bitten us twice:
 * it renders as a BLANK label in the pay-step review (map -> undefined -> "") and,
 * worse, gets submitted at checkout so the order carries a dead id the worker's
 * buildPrompts then silently drops or substitutes. Sanitizing here fixes it for
 * every reader at once (display, funnel guards, and the checkout payload).
 */
export function readState(product = PRODUCTS.HEADSHOTS) {
  const EMPTY = emptyFor(product);
  if (typeof window === 'undefined') return { ...EMPTY };
  try {
    const s = JSON.parse(window.localStorage.getItem(keyFor(product)) || '{}');
    const str = (v) => (typeof v === 'string' ? v : '');
    const valid = (v, isValid) => (isValid(str(v)) ? str(v) : '');
    const tierOk = (id) => isValidTier(id) && getTier(id).product === productOf(product);
    return {
      looks: Array.isArray(s.looks) ? s.looks.filter((id) => isValidLook(id, product)) : [],
      attire: Array.isArray(s.attire) ? s.attire.filter((id) => isValidAttire(id, product)) : [],
      gender: valid(s.gender, isValidGender),
      ageRange: valid(s.ageRange, isValidAgeRange),
      race: valid(s.race, isValidRace),
      facialHair: valid(s.facialHair, isValidFacialHair),
      build: valid(s.build, isValidBuild),
      images: Array.isArray(s.images) ? s.images : [],
      reuseFromOrderId: str(s.reuseFromOrderId),
      tier: tierOk(str(s.tier)) ? s.tier : EMPTY.tier,
    };
  } catch {
    return { ...EMPTY };
  }
}

/** Merge a patch into the stored state and return the new state. */
export function writeState(patch, product = PRODUCTS.HEADSHOTS) {
  if (typeof window === 'undefined') return emptyFor(product);
  const next = { ...readState(product), ...patch };
  window.localStorage.setItem(keyFor(product), JSON.stringify(next));
  return next;
}

/** Clear stored state (after the order is created). */
export function clearState(product = PRODUCTS.HEADSHOTS) {
  if (typeof window !== 'undefined') window.localStorage.removeItem(keyFor(product));
}

/**
 * The funnel steps. `pay` has no route of its own past the Stripe redirect; it
 * still renders in the stepper. Order defines "done vs upcoming".
 */
export function funnelSteps(product = PRODUCTS.HEADSHOTS) {
  const paths = funnelPaths(product);
  return [
    { key: 'about', label: 'About you', href: paths.about },
    { key: 'plan', label: 'Plan', href: paths.plan },
    { key: 'photos', label: 'Photos', href: paths.photos },
    { key: 'review', label: 'Review', href: paths.review },
    { key: 'pay', label: 'Pay' },
  ];
}
export const FUNNEL_STEPS = funnelSteps(PRODUCTS.HEADSHOTS);
