import { AppError } from '@travel-suite/utils';

export function createCurrencyService({ Currency }) {
  const getBaseCurrency = async () => {
    const base = await Currency.findOne({ isBaseCurrency: true }).lean();
    return base ?? { code: 'AED', rate: 1 };
  };

  // Convert an amount from the base currency into a target currency code.
  // Returns { amount, currencyCode }.
  const convertFromBase = async ({ amount, targetCode }) => {
    const code = String(targetCode || 'AED').toUpperCase();
    const currency = await Currency.findOne({ code }).lean();

    if (!currency) {
      // Unknown currency — fall back to base
      const base = await getBaseCurrency();
      return { amount: Number(amount.toFixed(2)), currencyCode: base.code };
    }

    const converted = Number((amount * currency.rate).toFixed(2));
    return { amount: converted, currencyCode: currency.code };
  };

  return { convertFromBase };
}
