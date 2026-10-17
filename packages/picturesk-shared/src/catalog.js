
import { PRODUCTS, DEFAULT_PRODUCT, productOf } from './products.js';


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

export const ATTIRE = Object.freeze([
  {
    id: 'black_tie',
    label: 'Black tie',
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



export const AGE_RANGES = Object.freeze([
  { id: 'age_18_24', label: '18 to 24', promptFragment: 'in their early twenties' },
  { id: 'age_25_34', label: '25 to 34', promptFragment: 'in their late twenties to early thirties' },
  { id: 'age_35_44', label: '35 to 44', promptFragment: 'in their late thirties to early forties' },
  { id: 'age_45_54', label: '45 to 54', promptFragment: 'in their late forties to early fifties' },
  { id: 'age_55_plus', label: '55 and over', promptFragment: 'in their late fifties or older' },
]);

export const GENDERS = Object.freeze([
  { id: 'woman', label: 'Woman', promptFragment: 'a woman' },
  { id: 'man', label: 'Man', promptFragment: 'a man' },
  { id: 'nonbinary', label: 'Non-binary', promptFragment: 'an androgynous person' },
]);

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

export const BUILDS = Object.freeze([
  { id: 'slim', label: 'Slim', promptFragment: 'with a slim build' },
  { id: 'average', label: 'Average', promptFragment: 'with an average build' },
  { id: 'athletic', label: 'Athletic', promptFragment: 'with an athletic build' },
  { id: 'broad', label: 'Broad', promptFragment: 'with a broad, solid build' },
  { id: 'plus', label: 'Plus-size', promptFragment: 'with a plus-size build' },
]);

export const HEIGHTS = Object.freeze([
  { id: 'under_160', label: "Under 160 cm (5'3\")", promptFragment: 'short in stature' },
  { id: 'h_160_170', label: "160 to 170 cm (5'3\" to 5'7\")", promptFragment: 'slightly below average height' },
  { id: 'h_170_180', label: "170 to 180 cm (5'7\" to 5'11\")", promptFragment: 'of average height' },
  { id: 'h_180_190', label: "180 to 190 cm (5'11\" to 6'3\")", promptFragment: 'tall' },
  { id: 'over_190', label: "Over 190 cm (6'3\")", promptFragment: 'very tall' },
]);

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
const HEIGHTS_BY_ID = Object.freeze(Object.fromEntries(HEIGHTS.map((h) => [h.id, h])));

export function isValidLook(id, product = DEFAULT_PRODUCT) {
  return Object.prototype.hasOwnProperty.call(catalogFor(product).looksById, id);
}
export function isValidAttire(id, product = DEFAULT_PRODUCT) {
  return Object.prototype.hasOwnProperty.call(catalogFor(product).attireById, id);
}
export function isValidAgeRange(id) {
  return Object.prototype.hasOwnProperty.call(AGE_RANGES_BY_ID, id);
}
export function isValidGender(id) {
  return Object.prototype.hasOwnProperty.call(GENDERS_BY_ID, id);
}
export function isValidRace(id) {
  return Object.prototype.hasOwnProperty.call(RACES_BY_ID, id);
}
export function isValidFacialHair(id) {
  return Object.prototype.hasOwnProperty.call(FACIAL_HAIR_BY_ID, id);
}
export function isValidBuild(id) {
  return Object.prototype.hasOwnProperty.call(BUILDS_BY_ID, id);
}
export function isValidHeight(id) {
  return Object.prototype.hasOwnProperty.call(HEIGHTS_BY_ID, id);
}

export function buildSubject({ gender, ageRange, race, facialHair, build, height } = {}) {
  let subject = GENDERS_BY_ID[gender]?.promptFragment || 'a person';
  const ageFrag = AGE_RANGES_BY_ID[ageRange]?.promptFragment;
  const raceFrag = RACES_BY_ID[race]?.promptFragment;
  const heightFrag = HEIGHTS_BY_ID[height]?.promptFragment;
  const buildFrag = BUILDS_BY_ID[build]?.promptFragment;
  const hairFrag = FACIAL_HAIR_BY_ID[facialHair]?.promptFragment;
  if (ageFrag) subject += ` ${ageFrag}`;
  if (raceFrag) subject += `, ${raceFrag}`;
  if (heightFrag) subject += `, ${heightFrag}`;
  if (buildFrag) subject += `, ${buildFrag}`;
  if (hairFrag) subject += `, ${hairFrag}`;
  return subject;
}

export const QUALITY_TAIL =
  'professional headshot portrait, head and shoulders framing with space above the head, ' +
  'shot on a DSLR with an 85mm portrait lens at eye level, shallow depth of field, ' +
  'softly blurred background, sharp focus on the face, natural realistic skin texture, ' +
  'sharp detailed eyes, high detail';

export const DATING_QUALITY_TAIL =
  'candid lifestyle photo, three-quarter or waist-up framing, shot on a full-frame camera ' +
  'with a 35mm lens, natural available light, warm tones, genuine relaxed expression, ' +
  'natural realistic skin texture with visible pores, no retouching, sharp eyes, ' +
  'slight film grain, looks like a photo a friend took';

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

export function buildPrompts({ looks = [], attire = [], count, subjectAnchor, product, gender }) {
  const cat = catalogFor(product);
  const dating = productOf(product) === PRODUCTS.DATING;
  const lookFrags = looks.map((id) => cat.looksById[id]?.promptFragment).filter(Boolean);
  const attireFrags = attire.map((id) => attireFragment(cat.attireById[id], gender)).filter(Boolean);

  const L = lookFrags.length ? lookFrags : [cat.looks[0].promptFragment];
  const A = attireFrags.length ? attireFrags : [attireFragment(cat.attire[0], gender)];

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
