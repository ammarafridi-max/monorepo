// The USD validity tiers, in one place so a price change is one edit rather
// than fifteen. Locale pages build their own from the price book they fetch,
// because quoting dollars to a rupee buyer is the problem those pages exist to
// solve.
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
