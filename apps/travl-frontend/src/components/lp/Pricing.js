export const CURRENCY = 'AED';
export const PRICING_OPTIONS = [
  { value: '2 Days', label: '2 Days', price: 49 },
  { value: '7 Days', label: '7 Days', price: 69 },
  { value: '14 Days', label: '14 Days', price: 79 },
];
export const LOWEST_PRICE = Math.min(...PRICING_OPTIONS.map((o) => o.price));
