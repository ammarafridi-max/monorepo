
export const PRODUCTS = Object.freeze({
  HEADSHOTS: 'headshots',
  DATING: 'dating',
});

export const DEFAULT_PRODUCT = PRODUCTS.HEADSHOTS;

const ALL = Object.freeze(Object.values(PRODUCTS));

export function isValidProduct(id) {
  return ALL.includes(id);
}

export function productOf(id) {
  return isValidProduct(id) ? id : DEFAULT_PRODUCT;
}
