const ZERO_DECIMAL_CURRENCIES = new Set([
  'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA',
  'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF',
]);

const THREE_DECIMAL_CURRENCIES = new Set(['BHD', 'JOD', 'KWD', 'OMR', 'TND']);

export function normalizeCurrencyCode(code) {
  const normalized = String(code ?? '').trim().toUpperCase();
  return /^[A-Z]{3}$/.test(normalized) ? normalized : null;
}

export function currencyDecimals(code) {
  const normalized = normalizeCurrencyCode(code);
  if (!normalized) return 2;
  if (ZERO_DECIMAL_CURRENCIES.has(normalized)) return 0;
  if (THREE_DECIMAL_CURRENCIES.has(normalized)) return 3;
  return 2;
}

// Stripe rejects three-decimal amounts that are not divisible by 10, so we only ever quote and charge
// two decimals for those currencies. Prices must round to something a gateway will actually accept.
export function payableDecimals(code) {
  return Math.min(currencyDecimals(code), 2);
}

// Number(null) and Number('') are 0, which would turn a missing amount into a free order.
export function parseAmount(value) {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export function roundToCurrency(amount, code) {
  const numeric = parseAmount(amount);
  if (numeric === null) return null;
  const factor = 10 ** payableDecimals(code);
  return Math.round(numeric * factor) / factor;
}

export function toFixedForCurrency(amount, code) {
  const rounded = roundToCurrency(amount, code);
  if (rounded === null) return null;
  return rounded.toFixed(payableDecimals(code));
}

export function toStripeMinorUnits(amount, code) {
  const rounded = roundToCurrency(amount, code);
  if (rounded === null) return null;
  return Math.round(rounded * 10 ** currencyDecimals(code));
}

export function fromStripeMinorUnits(minorUnits, code) {
  const numeric = parseAmount(minorUnits);
  if (numeric === null) return null;
  return Math.round(numeric) / 10 ** currencyDecimals(code);
}
