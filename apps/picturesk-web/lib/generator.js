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
} from '@travel-suite/picturesk-shared/catalog';
import { isValidTier } from '@travel-suite/picturesk-shared/pricing';

const KEY = 'picturesk.generator';

const EMPTY = {
  looks: [],
  attire: [],
  gender: '',
  ageRange: '',
  race: '',
  facialHair: '',
  email: '',
  images: [],
  tier: 'starter',
};

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
export function readState() {
  if (typeof window === 'undefined') return { ...EMPTY };
  try {
    const s = JSON.parse(window.localStorage.getItem(KEY) || '{}');
    const str = (v) => (typeof v === 'string' ? v : '');
    const valid = (v, isValid) => (isValid(str(v)) ? str(v) : '');
    return {
      looks: Array.isArray(s.looks) ? s.looks.filter(isValidLook) : [],
      attire: Array.isArray(s.attire) ? s.attire.filter(isValidAttire) : [],
      gender: valid(s.gender, isValidGender),
      ageRange: valid(s.ageRange, isValidAgeRange),
      race: valid(s.race, isValidRace),
      facialHair: valid(s.facialHair, isValidFacialHair),
      email: str(s.email),
      images: Array.isArray(s.images) ? s.images : [],
      tier: isValidTier(str(s.tier)) ? s.tier : 'starter',
    };
  } catch {
    return { ...EMPTY };
  }
}

/** Merge a patch into the stored state and return the new state. */
export function writeState(patch) {
  if (typeof window === 'undefined') return { ...EMPTY };
  const next = { ...readState(), ...patch };
  window.localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

/** Clear stored state (after the order is created). */
export function clearState() {
  if (typeof window !== 'undefined') window.localStorage.removeItem(KEY);
}

/**
 * The three funnel steps. `pay` has no route of its own past the Stripe redirect;
 * it still renders in the stepper. Order defines "done vs upcoming".
 */
export const FUNNEL_STEPS = [
  { key: 'select', label: 'Select', href: '/ai-headshot-generator/select' },
  { key: 'upload', label: 'Upload', href: '/ai-headshot-generator/upload' },
  { key: 'pay', label: 'Pay' },
];
