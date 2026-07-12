// Cross-step funnel state, held CLIENT-SIDE in localStorage until checkout.
//
// The flow is select -> upload -> pay, so we carry the selections, email, AND the
// uploaded photo URLs (photos are uploaded direct-to-R2 on the upload step, then
// their URLs ride along to the pay step). The order is created only at checkout
// (the pay step), so we never litter the database with abandoned drafts.
// localStorage is the right home for this: it is the real app (not an artifact),
// and the data is catalog ids, an email, and public R2 URLs. Cleared once the
// order is created.

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
};

/** Read the current funnel state. Safe on the server (returns empty). */
export function readState() {
  if (typeof window === 'undefined') return { ...EMPTY };
  try {
    const s = JSON.parse(window.localStorage.getItem(KEY) || '{}');
    return {
      looks: Array.isArray(s.looks) ? s.looks : [],
      attire: Array.isArray(s.attire) ? s.attire : [],
      gender: typeof s.gender === 'string' ? s.gender : '',
      ageRange: typeof s.ageRange === 'string' ? s.ageRange : '',
      race: typeof s.race === 'string' ? s.race : '',
      facialHair: typeof s.facialHair === 'string' ? s.facialHair : '',
      email: typeof s.email === 'string' ? s.email : '',
      images: Array.isArray(s.images) ? s.images : [],
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
  { key: 'select', label: 'Select', href: '/generator/select' },
  { key: 'upload', label: 'Upload', href: '/generator/upload' },
  { key: 'pay', label: 'Pay' },
];
