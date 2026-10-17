
import { PRODUCTS, productOf, isValidProduct } from '@travel-suite/picturesk-shared/products';
import { services } from '../data/services';

export { PRODUCTS, productOf };

const CONFIG = {
  [PRODUCTS.HEADSHOTS]: {
    id: PRODUCTS.HEADSHOTS,
    base: '/ai-headshot-generator',
    noun: 'headshots',
    title: 'Create your headshots. Picturesk.ai',
    defaultTier: 'pro',
    lookLabel: 'Background',
    lookNoun: 'background',
    lookHint: 'Choose one or more backgrounds. We spread your set across them.',
    attireLabel: 'Attire',
    attireHint: 'Choose what you want to wear. Mix a few for variety.',
    selectTitle: 'Choose your headshots.',
    selectLede: 'Pick your plan, background, and attire, and tell us where to send the results.',
  },
  [PRODUCTS.DATING]: {
    id: PRODUCTS.DATING,
    base: '/ai-dating-photos',
    noun: 'dating photos',
    title: 'Create your dating photos. Picturesk.ai',
    defaultTier: 'dating_pro',
    lookLabel: 'Scenes',
    lookNoun: 'scene',
    lookHint: 'Choose where the photos happen. We spread your set across them.',
    attireLabel: 'Outfits',
    attireHint: 'Clothes you would actually wear on a date. Mix a few for variety.',
    selectTitle: 'Choose your dating photos.',
    selectLede: 'Pick your plan, scenes, and outfits, and tell us where to send the results.',
  },
};

export function productConfig(product) {
  return CONFIG[productOf(product)];
}

export function funnelPaths(product) {
  const { base } = productConfig(product);
  return {
    landing: base,
    about: `${base}/about`,
    plan: `${base}/plan`,
    photos: `${base}/photos`,
    capture: `${base}/capture`,
    review: `${base}/review`,
    select: `${base}/about`,
  };
}

export function productForPath(pathname) {
  for (const cfg of Object.values(CONFIG)) {
    if (pathname?.startsWith(cfg.base)) return cfg.id;
  }
  return PRODUCTS.HEADSHOTS;
}

export function productForPage(pathname) {
  if (!pathname || pathname === '/') return null;
  for (const cfg of Object.values(CONFIG)) {
    if (pathname === cfg.base || pathname.startsWith(`${cfg.base}/`)) return cfg.id;
  }
  for (const group of services) {
    if (group.pages.some((p) => p.href === pathname)) return isValidProduct(group.id) ? group.id : null;
  }
  return null;
}

export function navCtaFor(pathname) {
  const product = productForPage(pathname);
  if (!product) return { label: 'Get started', href: null };
  const cfg = productConfig(product);
  return { label: `Get my ${cfg.noun}`, href: funnelPaths(product).select };
}
