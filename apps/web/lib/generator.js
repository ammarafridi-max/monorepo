// Cross-step funnel state, held CLIENT-SIDE in localStorage until checkout.
//
// Why localStorage and not the DB: the order is created only when the customer
// commits at /checkout, so we never litter the database with an order for every
// abandoned look/attire pick. localStorage is the right place for this: it is the
// real app (not an artifact), and the data is just catalog ids plus an email the
// user is about to submit anyway. It is cleared once the order is created.

const KEY = 'headliner.generator';

const EMPTY = { looks: [], attire: [], email: '' };

/** Read the current selections. Safe on the server (returns empty). */
export function readState() {
  if (typeof window === 'undefined') return { ...EMPTY };
  try {
    const s = JSON.parse(window.localStorage.getItem(KEY) || '{}');
    return {
      looks: Array.isArray(s.looks) ? s.looks : [],
      attire: Array.isArray(s.attire) ? s.attire : [],
      email: typeof s.email === 'string' ? s.email : '',
    };
  } catch {
    return { ...EMPTY };
  }
}

/** Merge a patch into the stored selections and return the new state. */
export function writeState(patch) {
  if (typeof window === 'undefined') return { ...EMPTY };
  const next = { ...readState(), ...patch };
  window.localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

/** Clear stored selections (after the order is created). */
export function clearState() {
  if (typeof window !== 'undefined') window.localStorage.removeItem(KEY);
}

/**
 * The visible funnel steps. `pay` and `results` have no route of their own (Pay
 * is the Stripe redirect; Results is /success), so they render in the stepper but
 * are never linked. Order matters: it defines "done vs upcoming".
 */
export const FUNNEL_STEPS = [
  { key: 'looks', label: 'Looks', href: '/generator/looks' },
  { key: 'attire', label: 'Attire', href: '/generator/attire' },
  { key: 'details', label: 'Details', href: '/generator/details' },
  { key: 'pay', label: 'Pay' },
  { key: 'upload', label: 'Upload', href: '/generator/upload' },
  { key: 'results', label: 'Results' },
];
