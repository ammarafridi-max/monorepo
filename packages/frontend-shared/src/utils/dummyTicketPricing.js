/**
 * @param {object} pricing - Pricing object from the API (may have a .options array)
 * @param {Array}  fallbackOptions - App-level default options used when the API
 *                                   returns nothing (pass PRICING_OPTIONS from config).
 */
export function normalizePricingOptions(pricing, fallbackOptions = []) {
  const source =
    Array.isArray(pricing?.options) && pricing.options.length > 0
      ? pricing.options
      : fallbackOptions;

  return source
    .map((option, index) => ({
      value: option.validity || option.value,
      label: option.validity || option.label || option.value,
      price: Number(option.price),
      sortOrder: Number.isFinite(Number(option.sortOrder))
        ? Number(option.sortOrder)
        : index,
    }))
    .filter((option) => option.value && Number.isFinite(option.price))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * @param {object} pricing        - Pricing object from the API
 * @param {string} validity       - The validity string to look up (e.g. "2 Days")
 * @param {Array}  fallbackOptions - App-level default options (passed to normalizePricingOptions)
 */
export function getTicketPriceByValidity(pricing, validity, fallbackOptions = []) {
  const options = normalizePricingOptions(pricing, fallbackOptions);
  const match = options.find((option) => option.value === validity);

  if (match) return match.price;

  return options[0]?.price || 0;
}
