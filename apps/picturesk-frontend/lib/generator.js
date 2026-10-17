
import {
  isValidLook,
  isValidAttire,
  isValidGender,
  isValidAgeRange,
  isValidRace,
  isValidFacialHair,
  isValidBuild,
  isValidHeight,
} from '@travel-suite/picturesk-shared/catalog';
import { isValidTier, getTier } from '@travel-suite/picturesk-shared/pricing';
import { PRODUCTS, productOf, productConfig, funnelPaths } from './products';

const keyFor = (product) =>
  productOf(product) === PRODUCTS.HEADSHOTS ? 'picturesk.generator' : `picturesk.generator.${productOf(product)}`;

export const FUNNEL_DEFAULT_TIER = 'pro';

const emptyFor = (product) => ({
  looks: [],
  attire: [],
  gender: '',
  ageRange: '',
  race: '',
  facialHair: '',
  build: '',
  height: '',
  images: [],
  reuseFromOrderId: '',
  tier: productConfig(product).defaultTier,
});

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
      height: valid(s.height, isValidHeight),
      images: Array.isArray(s.images) ? s.images : [],
      reuseFromOrderId: str(s.reuseFromOrderId),
      tier: tierOk(str(s.tier)) ? s.tier : EMPTY.tier,
    };
  } catch {
    return { ...EMPTY };
  }
}

export function writeState(patch, product = PRODUCTS.HEADSHOTS) {
  if (typeof window === 'undefined') return emptyFor(product);
  const next = { ...readState(product), ...patch };
  window.localStorage.setItem(keyFor(product), JSON.stringify(next));
  return next;
}

export function clearState(product = PRODUCTS.HEADSHOTS) {
  if (typeof window !== 'undefined') window.localStorage.removeItem(keyFor(product));
}

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
