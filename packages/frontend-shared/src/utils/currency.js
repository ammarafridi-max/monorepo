export function normalizeAmount(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return 0;
  return Number(amount.toFixed(2));
}

export function convertAmount(amount, conversionRate = 1) {
  const parsedRate = Number(conversionRate || 1);
  const safeRate = Number.isFinite(parsedRate) && parsedRate > 0 ? parsedRate : 1;
  return normalizeAmount(Number(amount || 0) * safeRate);
}

export function formatAmount(value) {
  return normalizeAmount(value).toFixed(2);
}

export function formatCurrencyAmount(value, code = 'AED') {
  return `${code} ${formatAmount(value)}`;
}
