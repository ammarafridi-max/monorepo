// Per-product funnel config for the web: where the funnel lives, what the set is
// called, and where the landing page is. The catalogue and tiers themselves come
// from picturesk-shared so the web can never sell something the worker cannot make.

import { PRODUCTS, productOf } from '@travel-suite/picturesk-shared/products';

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
    select: `${base}/select`,
    upload: `${base}/upload`,
    capture: `${base}/capture`,
    payment: `${base}/payment`,
  };
}

/** The product a funnel pathname belongs to, for the stepper and the chrome. */
export function productForPath(pathname) {
  for (const cfg of Object.values(CONFIG)) {
    if (pathname?.startsWith(cfg.base)) return cfg.id;
  }
  return PRODUCTS.HEADSHOTS;
}
