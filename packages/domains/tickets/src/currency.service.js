import { AppError } from '@travel-suite/utils';

export function createCurrencyService({ Currency }) {
  const getBaseCurrency = async () => {
    const base = await Currency.findOne({ isBaseCurrency: true }).lean();
    return base ?? { code: 'AED', rate: 1 };
  };

  const convertFromBase = async ({ amount, targetCode }) => {
    const code = String(targetCode || 'AED').toUpperCase();
    const currency = await Currency.findOne({ code }).lean();

    if (!currency) {
      const base = await getBaseCurrency();
      return { amount: Number(amount.toFixed(2)), currencyCode: base.code };
    }

    const converted = Number((amount * currency.rate).toFixed(2));
    return { amount: converted, currencyCode: currency.code };
  };

  const convertToBase = async ({ amount, sourceCode }) => {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount)) return null;

    const base = await getBaseCurrency();
    const baseCode = String(base.code).toUpperCase();
    const code = String(sourceCode || baseCode).toUpperCase();

    if (code === baseCode) {
      return { amount: Number(numericAmount.toFixed(2)), currencyCode: baseCode, rate: 1 };
    }

    const currency = await Currency.findOne({ code }).lean();
    const rate = Number(currency?.rate);
    if (!currency || !Number.isFinite(rate) || rate <= 0) return null;

    return {
      amount: Number((numericAmount / rate).toFixed(2)),
      currencyCode: baseCode,
      rate,
    };
  };

  return { convertFromBase, convertToBase, getBaseCurrency };
}
