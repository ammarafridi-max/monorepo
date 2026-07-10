/**
 * The look + attire catalog and prompt builder. THE single source of truth for
 * the choices a customer makes and the prompts we actually generate from them,
 * imported by BOTH the web (to render the selection cards) and the worker (to
 * build generation prompts). Keeping them together is the whole point: the
 * options a customer sees can never drift from what the model is told to make.
 *
 * A LOOK is the scene/lighting/background. ATTIRE is what the subject wears.
 * `promptFragment` is the piece of the generation prompt each contributes;
 * `label`/`description` are the user-facing copy (BRAND: verdict-first, no em
 * dashes). `image` is a preview URL shown next to the option on the select step;
 * leave it '' to render a placeholder, and drop in a real image URL later.
 */

/** @typedef {{ id: string, label: string, description: string, promptFragment: string, image: string }} Look */
/** @typedef {{ id: string, label: string, promptFragment: string, image: string }} Attire */

/** @type {readonly Look[]} */
export const LOOKS = Object.freeze([
  {
    id: 'corporate_studio',
    label: 'Corporate studio',
    description: 'Neutral grey seamless, soft key light.',
    promptFragment: 'against a neutral grey seamless studio backdrop, soft key lighting',
    image: '',
  },
  {
    id: 'office_environment',
    label: 'In-office',
    description: 'A modern office, softly blurred behind you.',
    promptFragment: 'in a modern office interior, softly blurred background bokeh, natural indoor light',
    image: '',
  },
  {
    id: 'outdoor_professional',
    label: 'Outdoor',
    description: 'Natural daylight, soft city or greenery behind.',
    promptFragment: 'outdoors in natural daylight, softly blurred city and greenery background',
    image: '',
  },
  {
    id: 'dramatic_studio',
    label: 'Dramatic studio',
    description: 'Dark, low-key background with rim light.',
    promptFragment: 'against a dark low-key studio background, dramatic rim lighting',
    image: '',
  },
  {
    id: 'bright_natural',
    label: 'Bright and natural',
    description: 'Window light, airy and clean.',
    promptFragment: 'in bright natural window light, airy and clean light background',
    image: '',
  },
]);

/** @type {readonly Attire[]} */
export const ATTIRE = Object.freeze([
  {
    id: 'business_suit',
    label: 'Business suit',
    promptFragment: 'wearing a well-tailored business suit',
    image: '',
  },
  {
    id: 'business_casual',
    label: 'Business casual, collared shirt',
    promptFragment: 'wearing a crisp business-casual collared shirt',
    image: '',
  },
  {
    id: 'smart_knit',
    label: 'Smart knit or sweater',
    promptFragment: 'wearing a smart knit sweater over a collared shirt',
    image: '',
  },
  {
    id: 'blazer_tee',
    label: 'Blazer over tee',
    promptFragment: 'wearing a tailored blazer over a plain tee',
    image: '',
  },
  {
    id: 'formal_traditional',
    label: 'Formal',
    // Deliberately neutral so it flatters any wardrobe/background rather than
    // forcing a specific garment.
    promptFragment: 'wearing polished, formal professional attire',
    image: '',
  },
]);

const LOOKS_BY_ID = Object.freeze(Object.fromEntries(LOOKS.map((l) => [l.id, l])));
const ATTIRE_BY_ID = Object.freeze(Object.fromEntries(ATTIRE.map((a) => [a.id, a])));

/** Is `id` a real look in the catalog? (Used by the api to validate /checkout.) */
export function isValidLook(id) {
  return Object.prototype.hasOwnProperty.call(LOOKS_BY_ID, id);
}
/** Is `id` a real attire option in the catalog? */
export function isValidAttire(id) {
  return Object.prototype.hasOwnProperty.call(ATTIRE_BY_ID, id);
}

/**
 * Build the generation prompts for an order from its selected looks + attire.
 * Pure and deterministic. THE single source of truth for prompt construction:
 * the worker calls this at generation time; nothing else assembles prompts.
 *
 * It enumerates every (look x attire) combination of the SELECTED ids in a stable
 * order and cycles through them to produce exactly `count` prompts, so a customer
 * who picks 2 looks and 2 attire gets all 4 combinations spread across the set.
 * Each prompt keeps the subject anchor FIRST (trigger word + subject), then
 * attire, then the look, then a shared quality tail, matching the anchoring the
 * worker relied on before (name the subject up front so a weak seed does not
 * drift). Unknown ids are ignored; an empty selection falls back to the first
 * catalog entry so we never emit a broken prompt.
 *
 * @param {Object} opts
 * @param {string[]} opts.looks - selected look ids
 * @param {string[]} opts.attire - selected attire ids
 * @param {number} opts.count - how many prompt strings to return (== generateCount)
 * @param {string} opts.subjectAnchor - e.g. "HDLNRZ, a person" (trigger + subject)
 * @returns {string[]} exactly `count` prompt strings
 */
export function buildPrompts({ looks = [], attire = [], count, subjectAnchor }) {
  const lookFrags = looks.map((id) => LOOKS_BY_ID[id]?.promptFragment).filter(Boolean);
  const attireFrags = attire.map((id) => ATTIRE_BY_ID[id]?.promptFragment).filter(Boolean);

  // Fall back to the first catalog entry so a bad/empty selection still yields
  // usable prompts rather than throwing on the money path.
  const L = lookFrags.length ? lookFrags : [LOOKS[0].promptFragment];
  const A = attireFrags.length ? attireFrags : [ATTIRE[0].promptFragment];

  // Every selected combination, in a stable order (attire varies fastest).
  const combos = [];
  for (const look of L) for (const att of A) combos.push({ look, att });

  const n = Number.isInteger(count) && count > 0 ? count : combos.length;
  const prompts = [];
  for (let i = 0; i < n; i++) {
    const { look, att } = combos[i % combos.length];
    prompts.push(`${subjectAnchor}, ${att}, ${look}, sharp focus, high detail`);
  }
  return prompts;
}
