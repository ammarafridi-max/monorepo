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
    image: '/corporate-business.jpg',
  },
  {
    id: 'office_environment',
    label: 'In-office',
    description: 'A modern office, softly blurred behind you.',
    promptFragment: 'in a modern office interior, softly blurred background bokeh, natural indoor light',
    image: '/office-formal.jpg',
  },
  {
    id: 'outdoor_professional',
    label: 'Outdoor',
    description: 'Natural daylight, soft city or greenery behind.',
    promptFragment: 'outdoors in natural daylight, softly blurred city and greenery background',
    image: '/outdoor-sweater.jpg',
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
    image: '/outdoor-sweater.jpg',
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

/**
 * Subject demographics. These describe the person, not the scene, so they refine
 * the SUBJECT ANCHOR that leads every prompt (via buildSubject) rather than being
 * combined like looks x attire. Gender is the head noun; age and race modify it.
 * `promptFragment` is the phrase each contributes; `label` is the user-facing copy.
 *
 * Age and gender are asked on the select step; race is optional. All three are
 * optional at the data layer so a legacy or partial order still yields a valid
 * generic subject ("a person").
 */

/** @typedef {{ id: string, label: string, promptFragment: string }} Demographic */

/** @type {readonly Demographic[]} */
export const AGE_RANGES = Object.freeze([
  { id: 'age_18_24', label: '18 to 24', promptFragment: 'in their early twenties' },
  { id: 'age_25_34', label: '25 to 34', promptFragment: 'in their late twenties to early thirties' },
  { id: 'age_35_44', label: '35 to 44', promptFragment: 'in their late thirties to early forties' },
  { id: 'age_45_54', label: '45 to 54', promptFragment: 'in their late forties to early fifties' },
  { id: 'age_55_plus', label: '55 and over', promptFragment: 'in their late fifties or older' },
]);

/** @type {readonly Demographic[]} */
export const GENDERS = Object.freeze([
  { id: 'woman', label: 'Woman', promptFragment: 'a woman' },
  { id: 'man', label: 'Man', promptFragment: 'a man' },
  { id: 'nonbinary', label: 'Non-binary', promptFragment: 'an androgynous person' },
]);

/** @type {readonly Demographic[]} */
export const RACES = Object.freeze([
  { id: 'east_asian', label: 'East Asian', promptFragment: 'of East Asian descent' },
  { id: 'south_asian', label: 'South Asian', promptFragment: 'of South Asian descent' },
  { id: 'southeast_asian', label: 'Southeast Asian', promptFragment: 'of Southeast Asian descent' },
  { id: 'black', label: 'Black or African', promptFragment: 'of Black or African descent' },
  { id: 'white', label: 'White or European', promptFragment: 'of White or European descent' },
  { id: 'hispanic', label: 'Hispanic or Latino', promptFragment: 'of Hispanic or Latino descent' },
  { id: 'middle_eastern', label: 'Middle Eastern', promptFragment: 'of Middle Eastern descent' },
  { id: 'indigenous', label: 'Indigenous', promptFragment: 'of Indigenous descent' },
  { id: 'mixed', label: 'Mixed heritage', promptFragment: 'of mixed heritage' },
]);

// Facial hair. Optional, but the single most useful appearance cue to name in the
// prompt: without it, FLUX's "professional headshot" prior drifts toward
// clean-shaven and the trained beard shrinks or vanishes across the set. Naming it
// in the subject anchor holds the beard steady. `clean-shaven` is a real choice,
// not just "unset": it tells the model to KEEP the face bare instead of guessing.
/** @type {readonly Demographic[]} */
export const FACIAL_HAIR = Object.freeze([
  { id: 'clean_shaven', label: 'Clean-shaven', promptFragment: 'clean-shaven' },
  { id: 'stubble', label: 'Stubble', promptFragment: 'with light stubble' },
  { id: 'short_beard', label: 'Short beard', promptFragment: 'with a short, neatly trimmed beard' },
  { id: 'full_beard', label: 'Full beard', promptFragment: 'with a full beard' },
  { id: 'moustache', label: 'Moustache', promptFragment: 'with a moustache' },
  { id: 'goatee', label: 'Goatee', promptFragment: 'with a goatee' },
]);

const LOOKS_BY_ID = Object.freeze(Object.fromEntries(LOOKS.map((l) => [l.id, l])));
const ATTIRE_BY_ID = Object.freeze(Object.fromEntries(ATTIRE.map((a) => [a.id, a])));
const AGE_RANGES_BY_ID = Object.freeze(Object.fromEntries(AGE_RANGES.map((a) => [a.id, a])));
const GENDERS_BY_ID = Object.freeze(Object.fromEntries(GENDERS.map((g) => [g.id, g])));
const RACES_BY_ID = Object.freeze(Object.fromEntries(RACES.map((r) => [r.id, r])));
const FACIAL_HAIR_BY_ID = Object.freeze(Object.fromEntries(FACIAL_HAIR.map((f) => [f.id, f])));

/** Is `id` a real look in the catalog? (Used by the api to validate /checkout.) */
export function isValidLook(id) {
  return Object.prototype.hasOwnProperty.call(LOOKS_BY_ID, id);
}
/** Is `id` a real attire option in the catalog? */
export function isValidAttire(id) {
  return Object.prototype.hasOwnProperty.call(ATTIRE_BY_ID, id);
}
/** Is `id` a real age range? */
export function isValidAgeRange(id) {
  return Object.prototype.hasOwnProperty.call(AGE_RANGES_BY_ID, id);
}
/** Is `id` a real gender option? */
export function isValidGender(id) {
  return Object.prototype.hasOwnProperty.call(GENDERS_BY_ID, id);
}
/** Is `id` a real race option? */
export function isValidRace(id) {
  return Object.prototype.hasOwnProperty.call(RACES_BY_ID, id);
}
/** Is `id` a real facial-hair option? */
export function isValidFacialHair(id) {
  return Object.prototype.hasOwnProperty.call(FACIAL_HAIR_BY_ID, id);
}

/**
 * Build the subject phrase that leads every prompt, from the order's demographics.
 * Pure. Gender is the head noun ("a woman"), age and race modify it. Any missing
 * piece is simply omitted; with nothing set it falls back to a generic "a person"
 * so the money path never emits a broken subject.
 *
 * e.g. { gender: 'man', ageRange: 'age_25_34', race: 'south_asian', facialHair: 'full_beard' }
 *      -> "a man in their late twenties to early thirties, of South Asian descent, with a full beard"
 *
 * @param {Object} [opts]
 * @param {string} [opts.gender]     - gender id
 * @param {string} [opts.ageRange]   - age range id
 * @param {string} [opts.race]       - race id (optional)
 * @param {string} [opts.facialHair] - facial-hair id (optional)
 * @returns {string} the subject phrase (never empty)
 */
export function buildSubject({ gender, ageRange, race, facialHair } = {}) {
  let subject = GENDERS_BY_ID[gender]?.promptFragment || 'a person';
  const ageFrag = AGE_RANGES_BY_ID[ageRange]?.promptFragment;
  const raceFrag = RACES_BY_ID[race]?.promptFragment;
  const hairFrag = FACIAL_HAIR_BY_ID[facialHair]?.promptFragment;
  if (ageFrag) subject += ` ${ageFrag}`;
  if (raceFrag) subject += `, ${raceFrag}`;
  if (hairFrag) subject += `, ${hairFrag}`;
  return subject;
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
