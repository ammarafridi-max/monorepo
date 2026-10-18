import { getDummyTicketPricingServerApi } from '@travel-suite/frontend-shared/services/apiPricing';

export const USD_FALLBACK = { '2 Days': 13, '7 Days': 19, '14 Days': 21 };

export async function getUsdPrices() {
  try {
    const data = await getDummyTicketPricingServerApi('USD');
    if (data?.currency !== 'USD' || !data?.options?.length) return USD_FALLBACK;
    return Object.fromEntries(data.options.map((o) => [o.validity, o.price]));
  } catch {
    return USD_FALLBACK;
  }
}

export const usd = (n) => `USD ${Number(n)}`;

export const usdTiers = (prices) => [
  { label: '2 days', price: usd(prices['2 Days']) },
  { label: '7 days', price: usd(prices['7 Days']) },
  { label: '14 days', price: usd(prices['14 Days']) },
];

export const tiersFrom = (prices, format) => [
  { label: '2 days', price: format(prices['2 Days']) },
  { label: '7 days', price: format(prices['7 Days']) },
  { label: '14 days', price: format(prices['14 Days']) },
];
