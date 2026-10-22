import { AppError } from '@travel-suite/utils';
import { normalizeCurrencyCode, roundToCurrency } from '@travel-suite/utils/currency';

const KEY = 'hotel-booking';
const DEFAULT_BASE_PRICE = 13;
const DEFAULT_PER_EXTRA_NIGHT = 0;

const normalizeCode = (code) => String(code || '').trim().toUpperCase();

export function createHotelPricingService({ HotelBookingPricing, Currency, conversionService }) {
  const getBaseCode = async () => {
    if (conversionService) return conversionService.getBaseCode();
    const base = await Currency?.findOne({ isBaseCurrency: true }).lean();
    return base?.code || 'AED';
  };

  // Mirrors the dummy ticket books: a currency without its own prices is charged the base price converted.
  const inRequestedCurrency = async ({ amount, fromCode, toCode }) => {
    const requested = normalizeCurrencyCode(toCode);
    if (!requested || !conversionService || requested === fromCode) return null;
    return conversionService.convert({ amount, fromCode, toCode: requested });
  };

  async function ensureDefaultBook() {
    const code = await getBaseCode();
    const onBase = await HotelBookingPricing.findOne({ key: KEY, currency: code });
    if (onBase) return onBase;
    const any = await HotelBookingPricing.findOne({ key: KEY });
    if (any) return any;
    try {
      return await HotelBookingPricing.create({
        key: KEY,
        currency: code,
        basePrice: DEFAULT_BASE_PRICE,
        perExtraNight: DEFAULT_PER_EXTRA_NIGHT,
      });
    } catch (err) {
      // A concurrent first request may have created it already; the unique {key, currency} index tells us so.
      if (err?.code !== 11000) throw err;
      const existing = await HotelBookingPricing.findOne({ key: KEY, currency: code });
      if (existing) return existing;
      throw err;
    }
  }

  const findBook = async (code) => {
    const c = normalizeCode(code);
    return c ? HotelBookingPricing.findOne({ key: KEY, currency: c }) : null;
  };

  const resolvePrice = async ({ nights, targetCode }) => {
    const n = Number(nights);
    if (!Number.isFinite(n) || n < 1) throw new AppError('Nights must be at least 1 to price a reservation', 400);
    const exact = await findBook(targetCode);
    const book = exact || (await ensureDefaultBook());
    const total = book.basePrice + book.perExtraNight * (n - 1);

    if (!exact) {
      const converted = await inRequestedCurrency({
        amount: total,
        fromCode: book.currency,
        toCode: targetCode,
      });
      if (converted) {
        return { totalAmount: converted.amount, currencyCode: converted.currencyCode, isExact: false };
      }
    }

    return {
      totalAmount: roundToCurrency(total, book.currency),
      currencyCode: book.currency,
      isExact: Boolean(exact),
    };
  };

  const getPricingPublic = async (currency) => {
    const exact = await findBook(currency);
    const book = exact || (await ensureDefaultBook());

    if (!exact) {
      const [base, extra] = await Promise.all([
        inRequestedCurrency({ amount: book.basePrice, fromCode: book.currency, toCode: currency }),
        inRequestedCurrency({ amount: book.perExtraNight, fromCode: book.currency, toCode: currency }),
      ]);
      if (base && extra) {
        return { currency: base.currencyCode, basePrice: base.amount, perExtraNight: extra.amount };
      }
    }

    return { currency: book.currency, basePrice: book.basePrice, perExtraNight: book.perExtraNight };
  };

  const listPriceBooks = async () => {
    const [books, baseCode] = await Promise.all([
      HotelBookingPricing.find({ key: KEY }).lean(),
      getBaseCode(),
    ]);
    return books
      .map((b) => ({ currency: b.currency, basePrice: b.basePrice, perExtraNight: b.perExtraNight, updatedAt: b.updatedAt, isBaseCurrency: b.currency === baseCode }))
      .sort((a, b) => (a.isBaseCurrency !== b.isBaseCurrency ? Number(b.isBaseCurrency) - Number(a.isBaseCurrency) : a.currency.localeCompare(b.currency)));
  };

  const updatePricing = async ({ currency, basePrice, perExtraNight, updatedBy }) => {
    const code = normalizeCode(currency) || (await getBaseCode());
    if (Currency && !(await Currency.exists({ code }))) throw new AppError(`Unknown currency: ${code}`, 400);
    const base = Number(basePrice);
    const extra = perExtraNight === undefined ? 0 : Number(perExtraNight);
    if (!Number.isFinite(base) || base < 0) throw new AppError('Invalid base price', 400);
    if (!Number.isFinite(extra) || extra < 0) throw new AppError('Invalid per-extra-night price', 400);
    const book = await HotelBookingPricing.findOneAndUpdate(
      { key: KEY, currency: code },
      { $set: { basePrice: Number(base.toFixed(2)), perExtraNight: Number(extra.toFixed(2)), updatedBy: updatedBy || null } },
      { new: true, upsert: true },
    );
    return { currency: book.currency, basePrice: book.basePrice, perExtraNight: book.perExtraNight, updatedAt: book.updatedAt };
  };

  const deletePriceBook = async (currency) => {
    const code = normalizeCode(currency);
    if (!code) throw new AppError('Currency is required', 400);
    if (code === (await getBaseCode())) throw new AppError('Cannot delete the base currency price book', 400);
    const res = await HotelBookingPricing.deleteOne({ key: KEY, currency: code });
    if (!res.deletedCount) throw new AppError(`No price book for ${code}`, 404);
    return { currency: code, deleted: true };
  };

  return { resolvePrice, getPricingPublic, listPriceBooks, updatePricing, deletePriceBook };
}
