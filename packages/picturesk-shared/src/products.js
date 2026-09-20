/**
 * The products Picturesk sells. Each is a separate funnel, catalogue and price
 * ladder on the same training and generation engine. The id is stamped on every
 * order and drives which catalogue validates it and which prompt tail the worker
 * uses. Add a product here first; everything else keys off this list.
 */

export const PRODUCTS = Object.freeze({
  HEADSHOTS: 'headshots',
  DATING: 'dating',
});

export const DEFAULT_PRODUCT = PRODUCTS.HEADSHOTS;

const ALL = Object.freeze(Object.values(PRODUCTS));

export function isValidProduct(id) {
  return ALL.includes(id);
}

/** The product for `id`, or the default for a missing or unknown one (legacy orders). */
export function productOf(id) {
  return isValidProduct(id) ? id : DEFAULT_PRODUCT;
}
