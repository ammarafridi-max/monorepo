const SUPPORTED_CURRENCIES = new Set([
  'AUD', 'CAD', 'CHF', 'CZK', 'DKK', 'EUR', 'GBP', 'HKD', 'HUF', 'ILS',
  'JPY', 'MXN', 'NOK', 'NZD', 'PHP', 'PLN', 'SEK', 'SGD', 'THB', 'TWD', 'USD',
]);

const NO_DECIMAL_CURRENCIES = new Set(['HUF', 'JPY', 'TWD']);

export const PAYPAL_FALLBACK_CURRENCY = 'USD';

export function isPayPalCurrency(code) {
  return SUPPORTED_CURRENCIES.has(String(code ?? '').trim().toUpperCase());
}

export function payPalCurrencyFor(code) {
  const normalized = String(code ?? '').trim().toUpperCase();
  return SUPPORTED_CURRENCIES.has(normalized) ? normalized : PAYPAL_FALLBACK_CURRENCY;
}

export function payPalCurrencyDecimals(code) {
  return NO_DECIMAL_CURRENCIES.has(String(code ?? '').trim().toUpperCase()) ? 0 : 2;
}

export function formatPayPalAmount(amount, code) {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) return null;
  return numeric.toFixed(payPalCurrencyDecimals(code));
}
