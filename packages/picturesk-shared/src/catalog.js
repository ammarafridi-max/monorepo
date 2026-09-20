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

import { PRODUCTS, DEFAULT_PRODUCT, productOf } from './products.js';

/** @typedef {{ id: string, label: string, description: string, promptFragment: string, image: string, swatch?: string, note?: string }} Look */
// `swatch` is a solid CSS color the UI shows as the preview when there is no real
// `image` yet -- for a background option, the backdrop tone is a fair stand-in.
/** @typedef {{ id: string, label: string, promptFragment: string, promptFragmentByGender?: Record<string, string>, image: string }} Attire */

/** @type {readonly Look[]} */
export const LOOKS = Object.freeze([
  {
    id: 'corporate_studio',
    label: 'Corporate studio',
    description: 'Neutral grey seamless, soft key light.',
    promptFragment: 'against a neutral grey seamless studio backdrop, soft key lighting',
    image: '/corporate-studio.jpg',
  },
  {
    id: 'office_environment',
    label: 'In-office',
    description: 'A modern office, softly blurred behind you.',
    promptFragment: 'in a modern office interior, softly blurred background bokeh, natural indoor light',
    image: '/in-office.jpg',
  },
  {
    id: 'outdoor_professional',
    label: 'Outdoor',
    description: 'Natural daylight, soft city or greenery behind.',
    promptFragment: 'outdoors in natural daylight, softly blurred city and greenery background',
    image: '/outdoor.jpg',
  },
  {
    id: 'dramatic_studio',
    label: 'Dramatic studio',
    description: 'Dark, low-key background with rim light.',
    promptFragment: 'against a dark low-key studio background, dramatic rim lighting',
    image: '/dramatic-studio.jpg',
    swatch: '#1b1b20',
  },
  {
    id: 'bright_natural',
    label: 'Bright and natural',
    description: 'Window light, airy and clean.',
    promptFragment: 'in bright natural window light, airy and clean light background',
    image: '/bright-natural.jpg',
    swatch: '#f1efe9',
  },
  {
    id: 'white_studio',
    label: 'White studio',
    description: 'Clean white seamless, high-key.',
    promptFragment: 'against a clean white seamless studio backdrop, bright high-key lighting',
    image: '/white-studio.jpg',
    swatch: '#f6f5f1',
  },
  {
    id: 'blue_gradient',
    label: 'Blue studio',
    description: 'Cool blue studio backdrop.',
    promptFragment: 'against a smooth blue gradient studio backdrop, even soft lighting',
    image: '/blue-studio.jpg',
    swatch: '#3d5c86',
  },
  {
    id: 'warm_neutral',
    label: 'Warm neutral',
    description: 'Soft beige backdrop, warm tone.',
    promptFragment: 'against a warm neutral beige studio backdrop, soft flattering light',
    image: '/warm-neutral.jpg',
    swatch: '#e7ddcd',
  },
  {
    id: 'library_bookshelf',
    label: 'Library',
    description: 'Warm bookshelves, softly blurred.',
    promptFragment: 'in front of a warm wooden bookshelf, softly blurred background, cozy indoor lighting',
    image: '/library.jpg',
    swatch: '#6a4c31',
  },
  {
    id: 'urban_brick',
    label: 'Urban brick',
    description: 'Textured brick wall, city feel.',
    promptFragment: 'against a textured exposed brick wall, soft directional daylight',
    image: '/urban-brick.jpg',
    swatch: '#9d5a44',
  },
  {
    id: 'greenery',
    label: 'Greenery',
    description: 'Lush green foliage outdoors.',
    promptFragment: 'outdoors against lush green foliage, soft natural daylight, blurred background',
    image: '/greenery.jpg',
    swatch: '#3f6b4a',
  },
]);

/** @type {readonly Attire[]} */
// Ordered dressiest -> most casual. Every fragment is gender-neutral: the gender
// anchor (buildSubject) decides the cut, so "business suit" / "black-tie attire"
// render correctly for any subject. Keep it that way unless we add gender-conditional
// attire (which would unlock gendered garments like gowns or cultural formal wear).
export const ATTIRE = Object.freeze([
  {
    id: 'black_tie',
    label: 'Black tie',
    // Neutral wording so the gender anchor renders a tux or an evening gown.
    promptFragment: 'wearing elegant black-tie evening attire',
    image: '/attire-black-tie.jpg',
  },
  {
    id: 'business_suit',
    label: 'Business suit',
    promptFragment: 'wearing a well-tailored business suit',
    image: '/attire-business-suit.jpg',
  },
  {
    id: 'three_piece',
    label: 'Three-piece suit',
    promptFragment: 'wearing a tailored three-piece suit with a waistcoat',
    image: '/attire-three-piece.jpg',
  },
  {
    id: 'business_casual',
    label: 'Business casual, collared shirt',
    promptFragment: 'wearing a crisp business-casual collared shirt',
    image: '/attire-business-casual.jpg',
  },
  {
    id: 'blazer_tee',
    label: 'Blazer over tee',
    promptFragment: 'wearing a tailored blazer over a plain tee',
    image: '',
  },
  {
    id: 'polo',
    label: 'Polo shirt',
    promptFragment: 'wearing a smart fitted polo shirt',
    image: '/attire-polo.jpg',
  },
  {
    id: 'smart_knit',
    label: 'Smart knit or sweater',
    promptFragment: 'wearing a smart knit sweater over a collared shirt',
    image: '/outdoor-sweater.jpg',
  },
  {
    id: 'turtleneck',
    label: 'Turtleneck',
    promptFragment: 'wearing a fitted dark turtleneck',
    image: '/attire-turtleneck.jpg',
  },
]);

/**
 * Dating photos. Same engine, different catalogue: scenes a real date would happen
 * in, and clothes people actually own. Fragments are written for candid framing,
 * not a headshot. `note` is shown on the option card so the customer opts in
 * knowingly when a scene adds something that is not theirs (a dog).
 */

/** @type {readonly Look[]} */
export const DATING_LOOKS = Object.freeze([
  {
    id: 'coffee_shop',
    label: 'Coffee shop',
    description: 'Window seat, warm daylight, a cup in hand.',
    promptFragment: 'sitting at a window table in a bright independent coffee shop, holding a ceramic cup, warm morning daylight',
    image: '',
    swatch: '#b98b62',
  },
  {
    id: 'rooftop_golden_hour',
    label: 'Rooftop at golden hour',
    description: 'City skyline, low sun, relaxed.',
    promptFragment: 'on a rooftop terrace at golden hour with a soft city skyline behind, warm low sunlight',
    image: '',
    swatch: '#d9964f',
  },
  {
    id: 'city_street_evening',
    label: 'City street, evening',
    description: 'Neon and shopfronts softly out of focus.',
    promptFragment: 'walking down a lively city street in the evening, shopfront lights and neon softly blurred behind',
    image: '',
    swatch: '#3d4a6b',
  },
  {
    id: 'hiking_trail',
    label: 'Hiking trail',
    description: 'Mountain path, open air, natural light.',
    promptFragment: 'on a mountain hiking trail with a wide valley view behind, overcast natural light, wind in the hair',
    image: '',
    swatch: '#6b8a5a',
  },
  {
    id: 'beach_sunset',
    label: 'Beach at sunset',
    description: 'Sand, sea and a warm sky.',
    promptFragment: 'standing on a quiet beach at sunset, sea and warm orange sky behind, hair slightly windblown',
    image: '',
    swatch: '#e2a266',
  },
  {
    id: 'park_picnic',
    label: 'Park picnic',
    description: 'Blanket on the grass, dappled shade.',
    promptFragment: 'sitting on a picnic blanket in a leafy park, dappled afternoon sunlight through the trees',
    image: '',
    swatch: '#7fa35c',
  },
  {
    id: 'cosy_kitchen',
    label: 'Cosy kitchen',
    description: 'Cooking at home, warm and lived in.',
    promptFragment: 'in a warm home kitchen preparing food at the counter, soft window light, lived-in details',
    image: '',
    swatch: '#c9a982',
  },
  {
    id: 'bookshop',
    label: 'Bookshop',
    description: 'Shelves of books, soft indoor light.',
    promptFragment: 'browsing shelves in a small independent bookshop, warm tungsten light, holding an open book',
    image: '',
    swatch: '#8a6a4f',
  },
  {
    id: 'dinner_table',
    label: 'Dinner out',
    description: 'Restaurant table, candlelight, mid-conversation.',
    promptFragment: 'seated at a restaurant table in the evening, candlelight and warm ambient light, mid-conversation',
    image: '',
    swatch: '#6e3f3a',
  },
  {
    id: 'travel_old_town',
    label: 'Travelling, old town',
    description: 'Cobbled street, pastel buildings, holiday light.',
    promptFragment: 'on a cobbled street in a sunny European old town, pastel facades softly blurred behind, holiday atmosphere',
    image: '',
    swatch: '#d8b47a',
  },
  {
    id: 'gym_casual',
    label: 'Gym, casual',
    description: 'Post-workout, dressed, not posing.',
    promptFragment: 'in a modern gym after a workout, dressed in training clothes, towel over the shoulder, relaxed and not posing, natural light from tall windows',
    image: '',
    swatch: '#5c6470',
    note: 'Adds a gym setting. You stay dressed and it stays casual.',
  },
  {
    id: 'dog_park',
    label: 'With a dog',
    description: 'Outdoors with a friendly dog.',
    promptFragment: 'outdoors in a park crouching beside a friendly medium-sized dog, both looking relaxed, soft daylight',
    image: '',
    swatch: '#8d9a6a',
    note: 'This adds a dog that is not yours. Pick it only if you are happy with that.',
  },
]);

/** @type {readonly Attire[]} */
// `promptFragmentByGender` overrides the neutral fragment where the garment reads
// differently by gender; buildPrompts picks by the order's gender id.
export const DATING_ATTIRE = Object.freeze([
  {
    id: 'smart_casual_shirt',
    label: 'Smart casual shirt',
    promptFragment: 'wearing a well-fitted casual button-up shirt with the sleeves rolled',
    promptFragmentByGender: { woman: 'wearing a relaxed silk blouse' },
    image: '',
    swatch: '#9fb3c8',
  },
  {
    id: 'fitted_tee_jeans',
    label: 'Fitted tee and jeans',
    promptFragment: 'wearing a plain fitted t-shirt and dark jeans',
    image: '',
    swatch: '#2f3b52',
  },
  {
    id: 'knit_sweater',
    label: 'Knit sweater',
    promptFragment: 'wearing a soft crew-neck knit sweater',
    image: '',
    swatch: '#b8a48c',
  },
  {
    id: 'linen_summer',
    label: 'Linen, summer',
    promptFragment: 'wearing a light linen shirt, top buttons open',
    promptFragmentByGender: { woman: 'wearing a light linen summer dress' },
    image: '',
    swatch: '#e6dcc3',
  },
  {
    id: 'denim_jacket',
    label: 'Denim jacket',
    promptFragment: 'wearing a classic denim jacket over a white tee',
    image: '',
    swatch: '#4a6a95',
  },
  {
    id: 'bomber_jacket',
    label: 'Bomber or leather jacket',
    promptFragment: 'wearing a fitted bomber jacket',
    promptFragmentByGender: { woman: 'wearing a cropped leather jacket over a simple top' },
    image: '',
    swatch: '#3a3a3a',
  },
  {
    id: 'blazer_no_tie',
    label: 'Blazer, no tie',
    promptFragment: 'wearing an unstructured blazer over an open-collar shirt, no tie',
    promptFragmentByGender: { woman: 'wearing a relaxed blazer over a simple top' },
    image: '',
    swatch: '#5a6270',
  },
  {
    id: 'athleisure',
    label: 'Athleisure',
    promptFragment: 'wearing clean modern athleisure, a fitted hoodie or quarter-zip',
    image: '',
    swatch: '#7a8590',
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
/**
 * Body build, asked as one chip row instead of height and weight. It only exists
 * to keep the generated body honest to the person, so the fragment names the build
 * plainly and nothing else.
 * @type {readonly Demographic[]}
 */
export const BUILDS = Object.freeze([
  { id: 'slim', label: 'Slim', promptFragment: 'with a slim build' },
  { id: 'average', label: 'Average', promptFragment: 'with an average build' },
  { id: 'athletic', label: 'Athletic', promptFragment: 'with an athletic build' },
  { id: 'broad', label: 'Broad', promptFragment: 'with a broad, solid build' },
  { id: 'plus', label: 'Plus-size', promptFragment: 'with a plus-size build' },
]);

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
const DATING_LOOKS_BY_ID = Object.freeze(Object.fromEntries(DATING_LOOKS.map((l) => [l.id, l])));
const DATING_ATTIRE_BY_ID = Object.freeze(Object.fromEntries(DATING_ATTIRE.map((a) => [a.id, a])));

/**
 * The catalogue for a product: the option lists the select step renders and the
 * lookups checkout validates against. Unknown or missing product means headshots,
 * so every order that predates products keeps working.
 */
export function catalogFor(product) {
  if (product === PRODUCTS.DATING) {
    return { looks: DATING_LOOKS, attire: DATING_ATTIRE, looksById: DATING_LOOKS_BY_ID, attireById: DATING_ATTIRE_BY_ID };
  }
  return { looks: LOOKS, attire: ATTIRE, looksById: LOOKS_BY_ID, attireById: ATTIRE_BY_ID };
}

const AGE_RANGES_BY_ID = Object.freeze(Object.fromEntries(AGE_RANGES.map((a) => [a.id, a])));
const GENDERS_BY_ID = Object.freeze(Object.fromEntries(GENDERS.map((g) => [g.id, g])));
const RACES_BY_ID = Object.freeze(Object.fromEntries(RACES.map((r) => [r.id, r])));
const FACIAL_HAIR_BY_ID = Object.freeze(Object.fromEntries(FACIAL_HAIR.map((f) => [f.id, f])));
const BUILDS_BY_ID = Object.freeze(Object.fromEntries(BUILDS.map((b) => [b.id, b])));

/** Is `id` a real look in the product's catalog? (Used by the api to validate /checkout.) */
export function isValidLook(id, product = DEFAULT_PRODUCT) {
  return Object.prototype.hasOwnProperty.call(catalogFor(product).looksById, id);
}
/** Is `id` a real attire option in the product's catalog? */
export function isValidAttire(id, product = DEFAULT_PRODUCT) {
  return Object.prototype.hasOwnProperty.call(catalogFor(product).attireById, id);
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
/** Is `id` a real build option? */
export function isValidBuild(id) {
  return Object.prototype.hasOwnProperty.call(BUILDS_BY_ID, id);
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
export function buildSubject({ gender, ageRange, race, facialHair, build } = {}) {
  let subject = GENDERS_BY_ID[gender]?.promptFragment || 'a person';
  const ageFrag = AGE_RANGES_BY_ID[ageRange]?.promptFragment;
  const raceFrag = RACES_BY_ID[race]?.promptFragment;
  const buildFrag = BUILDS_BY_ID[build]?.promptFragment;
  const hairFrag = FACIAL_HAIR_BY_ID[facialHair]?.promptFragment;
  if (ageFrag) subject += ` ${ageFrag}`;
  if (raceFrag) subject += `, ${raceFrag}`;
  if (buildFrag) subject += `, ${buildFrag}`;
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
// The shared quality/photography tail appended to every generation prompt. It
// does the work behind "make it look like a photographer shot it, not a selfie":
//  - "head and shoulders framing with space above the head" pulls the camera back
//    and leaves headroom, so the square output survives LinkedIn's circular crop
//    instead of clipping the top of the head / chin.
//  - "85mm portrait lens at eye level" gives a photographer's distance and kills
//    the wide-angle selfie distortion.
//  - "shallow depth of field, softly blurred background" gives professional bokeh
//    (the old tail said "sharp focus, high detail", which kept the background tack
//    sharp); "sharp focus on the face" keeps the subject crisp.
// Scene-neutral wording ("headshot portrait", not "studio") so it does not fight
// an outdoor / office / greenery look. FLUX has no negative prompt, so everything
// here is positive phrasing. Kept in ONE place and reused by the dev tune script.
export const QUALITY_TAIL =
  'professional headshot portrait, head and shoulders framing with space above the head, ' +
  'shot on a DSLR with an 85mm portrait lens at eye level, shallow depth of field, ' +
  'softly blurred background, sharp focus on the face, natural realistic skin texture, ' +
  'sharp detailed eyes, high detail';

// The dating tail is the opposite brief: a candid lifestyle photo, wider framing,
// available light and visible skin texture. Every competitor complaint about
// "looks AI" is really about every shot being a posed studio portrait.
export const DATING_QUALITY_TAIL =
  'candid lifestyle photo, three-quarter or waist-up framing, shot on a full-frame camera ' +
  'with a 35mm lens, natural available light, warm tones, genuine relaxed expression, ' +
  'natural realistic skin texture with visible pores, no retouching, sharp eyes, ' +
  'slight film grain, looks like a photo a friend took';

// Poses cycle through dating prompts so a set is not all the same posed portrait.
// Two of five look away from the camera or are in motion on purpose.
const DATING_POSES = Object.freeze([
  'smiling naturally at the camera',
  'laughing, looking slightly off camera',
  'caught mid-movement, glancing back at the camera',
  'relaxed half-smile, looking at the camera',
  'looking away into the distance, unposed',
]);

function attireFragment(entry, gender) {
  if (!entry) return undefined;
  return entry.promptFragmentByGender?.[gender] || entry.promptFragment;
}

/**
 * @param {Object} opts
 * @param {string[]} opts.looks - selected look ids
 * @param {string[]} opts.attire - selected attire ids
 * @param {number} opts.count - how many prompt strings to return (== generateCount)
 * @param {string} opts.subjectAnchor - e.g. "HDLNRZ, a person" (trigger + subject)
 * @param {string} [opts.product] - product id; picks the catalogue, tail and poses
 * @param {string} [opts.gender] - gender id, for gender-conditional attire
 * @returns {string[]} exactly `count` prompt strings
 */
export function buildPrompts({ looks = [], attire = [], count, subjectAnchor, product, gender }) {
  const cat = catalogFor(product);
  const dating = productOf(product) === PRODUCTS.DATING;
  const lookFrags = looks.map((id) => cat.looksById[id]?.promptFragment).filter(Boolean);
  const attireFrags = attire.map((id) => attireFragment(cat.attireById[id], gender)).filter(Boolean);

  // Fall back to the first catalog entry so a bad/empty selection still yields
  // usable prompts rather than throwing on the money path.
  const L = lookFrags.length ? lookFrags : [cat.looks[0].promptFragment];
  const A = attireFrags.length ? attireFrags : [attireFragment(cat.attire[0], gender)];

  // Every selected combination, in a stable order (attire varies fastest).
  const combos = [];
  for (const look of L) for (const att of A) combos.push({ look, att });

  const n = Number.isInteger(count) && count > 0 ? count : combos.length;
  const prompts = [];
  for (let i = 0; i < n; i++) {
    const { look, att } = combos[i % combos.length];
    if (dating) {
      const pose = DATING_POSES[i % DATING_POSES.length];
      prompts.push(`${subjectAnchor}, ${att}, ${look}, ${pose}, ${DATING_QUALITY_TAIL}`);
    } else {
      prompts.push(`${subjectAnchor}, ${att}, ${look}, ${QUALITY_TAIL}`);
    }
  }
  return prompts;
}
