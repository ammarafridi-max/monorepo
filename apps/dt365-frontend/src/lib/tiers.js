import { getDummyTicketPricingServerApi } from '@travel-suite/frontend-shared/services/apiPricing';

const RETRY_DELAY_MS = 750;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Throws rather than falling back to a hardcoded figure: a locale page that advertises a price we would
// not charge is worse than one that fails and lets the last good render stay up. One retry keeps a blip
// from failing a build.
export async function getLocalePrices(currency) {
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (attempt > 0) await wait(RETRY_DELAY_MS);
    try {
      const data = await getDummyTicketPricingServerApi(currency);
      const options = Array.isArray(data?.options) ? data.options : [];
      if (data?.currency !== currency || options.length === 0) {
        throw new Error(`No live ${currency} dummy ticket pricing is available`);
      }
      return Object.fromEntries(options.map((o) => [o.validity, o.price]));
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

export async function getUsdPrices() {
  return getLocalePrices('USD');
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
