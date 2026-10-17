export const USD_TIERS = [
  { label: '2 days', price: 'USD 13' },
  { label: '7 days', price: 'USD 20' },
  { label: '14 days', price: 'USD 23' },
];

export const tiersFrom = (prices, format) => [
  { label: '2 days', price: format(prices['2 Days']) },
  { label: '7 days', price: format(prices['7 Days']) },
  { label: '14 days', price: format(prices['14 Days']) },
];
