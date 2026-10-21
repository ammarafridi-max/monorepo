import { normalizeCurrencyCode, parseAmount, roundToCurrency } from '@travel-suite/utils/currency';

export const DEFAULT_FALLBACK_BASE_CODE = 'AED';

export function createCurrencyConversionService({ Currency, fallbackBaseCode = DEFAULT_FALLBACK_BASE_CODE }) {
  const fallbackBase = normalizeCurrencyCode(fallbackBaseCode) || DEFAULT_FALLBACK_BASE_CODE;

  const getBaseCurrency = async () => {
    const base = await Currency?.findOne({ isBaseCurrency: true }).lean();
    if (base?.code && Number(base.rate) > 0) return { code: base.code, rate: 1 };
    return { code: fallbackBase, rate: 1 };
  };

  const getBaseCode = async () => (await getBaseCurrency()).code;

  const getRate = async (code) => {
    const normalized = normalizeCurrencyCode(code);
    if (!normalized) return null;
    const base = await getBaseCurrency();
    if (normalized === base.code) return 1;
    const currency = await Currency?.findOne({ code: normalized }).lean();
    const rate = Number(currency?.rate);
    return Number.isFinite(rate) && rate > 0 ? rate : null;
  };

  const convert = async ({ amount, fromCode, toCode }) => {
    const numericAmount = parseAmount(amount);
    if (numericAmount === null) return null;

    const base = await getBaseCurrency();
    const from = normalizeCurrencyCode(fromCode) || base.code;
    const to = normalizeCurrencyCode(toCode) || base.code;

    if (from === to) {
      return { amount: roundToCurrency(numericAmount, to), currencyCode: to, rate: 1 };
    }

    const [fromRate, toRate] = await Promise.all([getRate(from), getRate(to)]);
    if (fromRate === null || toRate === null) return null;

    const baseAmount = numericAmount / fromRate;
    return {
      amount: roundToCurrency(baseAmount * toRate, to),
      currencyCode: to,
      rate: toRate / fromRate,
    };
  };

  const convertFromBase = async ({ amount, targetCode }) => {
    const base = await getBaseCurrency();
    const converted = await convert({ amount, fromCode: base.code, toCode: targetCode });
    if (converted) return converted;
    return { amount: roundToCurrency(amount, base.code), currencyCode: base.code, rate: 1 };
  };

  const convertToBase = async ({ amount, sourceCode }) => {
    const base = await getBaseCurrency();
    return convert({ amount, fromCode: sourceCode, toCode: base.code });
  };

  return { getBaseCurrency, getBaseCode, getRate, convert, convertFromBase, convertToBase };
}
