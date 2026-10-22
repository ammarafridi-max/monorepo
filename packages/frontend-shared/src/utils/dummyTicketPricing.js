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

// Null rather than another validity's price: showing the wrong price is worse than showing none.
export function getTicketPriceByValidity(pricing, validity, fallbackOptions = []) {
  const options = normalizePricingOptions(pricing, fallbackOptions);
  const match = options.find((option) => option.value === validity);
  return match ? match.price : null;
}

export function lowestTicketPrice(pricing, fallbackOptions = []) {
  const options = normalizePricingOptions(pricing, fallbackOptions);
  if (options.length === 0) return null;
  return options.reduce((lowest, option) => (option.price < lowest.price ? option : lowest));
}
