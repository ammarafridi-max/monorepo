import { AppError, logger } from '@travel-suite/utils';
import { normalizeCurrencyCode, roundToCurrency } from '@travel-suite/utils/currency';
import { DEFAULT_PRICING_OPTIONS, TICKET_VALIDITIES } from './validity.js';

const KEY = 'dummy-ticket';
const DEFAULT_OPTIONS = DEFAULT_PRICING_OPTIONS;
const ALLOWED_VALIDITIES = new Set(TICKET_VALIDITIES);

function sortOptions(options = []) {
  return [...options].sort((a, b) =>
    a.sortOrder !== b.sortOrder ? a.sortOrder - b.sortOrder : a.validity.localeCompare(b.validity),
  );
}

function sanitizeOptions(options = [], currencyCode) {
  if (!Array.isArray(options) || options.length === 0) {
    throw new AppError('At least one pricing option is required', 400);
  }
  const seen = new Set();
  const sanitized = options.map((opt, i) => {
    const validity = String(opt?.validity || '').trim();
    const price = Number(opt?.price);
    const isActive = opt?.isActive === undefined ? true : Boolean(opt.isActive);
    const sortOrder = Number.isFinite(Number(opt?.sortOrder)) ? Number(opt.sortOrder) : i;
    if (!ALLOWED_VALIDITIES.has(validity)) throw new AppError(`Invalid validity option: ${validity}`, 400);
    if (seen.has(validity)) throw new AppError(`Duplicate validity option: ${validity}`, 400);
    if (!Number.isFinite(price) || price < 0) throw new AppError(`Invalid price for ${validity}`, 400);
    const rounded = roundToCurrency(price, currencyCode);
    if (isActive && rounded <= 0) {
      throw new AppError(`${validity} is on sale, so it needs a price above zero`, 400);
    }
    seen.add(validity);
    return { validity, price: rounded, isActive, sortOrder };
  });
  return sortOptions(sanitized);
}

const normalizeCode = (code) => String(code || '').trim().toUpperCase();

export function createPricingService({ TicketPricing, Currency, conversionService }) {
  const getBaseCode = async () => {
    if (conversionService) return conversionService.getBaseCode();
    const base = await Currency?.findOne({ isBaseCurrency: true }).lean();
    return base?.code || 'AED';
  };

  async function ensureDefaultBook() {
    const code = await getBaseCode();
    const onBase = await TicketPricing.findOne({ key: KEY, currency: code });
    if (onBase) return onBase;
    const any = await TicketPricing.findOne({ key: KEY });
    if (any) return any;
    try {
      return await TicketPricing.create({ key: KEY, currency: code, options: DEFAULT_OPTIONS });
    } catch (err) {
      // A concurrent first request may have created it already; the unique {key, currency} index tells us so.
      if (err?.code !== 11000) throw err;
      const existing = await TicketPricing.findOne({ key: KEY, currency: code });
      if (existing) return existing;
      throw err;
    }
  }

  const findBook = async (code) => {
    const c = normalizeCode(code);
    return c ? TicketPricing.findOne({ key: KEY, currency: c }) : null;
  };

  const activeOptions = (book) => sortOptions(book.options).filter((o) => o.isActive);

  const convertOptions = async (options, fromCode, toCode) => {
    if (!conversionService) return null;
    const converted = [];
    for (const option of options) {
      const result = await conversionService.convert({
        amount: option.price,
        fromCode,
        toCode,
      });
      if (!result) return null;
      converted.push({ ...option, price: result.amount });
    }
    return converted;
  };

  // Returns the options a buyer may choose from, priced in the currency they asked for.
  const getPricingPublic = async (currency) => {
    const requested = normalizeCurrencyCode(currency);
    const exact = await findBook(requested);
    const exactActive = exact ? activeOptions(exact) : [];

    if (exact && exactActive.length > 0) {
      return { currency: exact.currency, options: exactActive, isConverted: false };
    }

    const fallback = await ensureDefaultBook();
    const fallbackActive = activeOptions(fallback);

    if (!requested || requested === fallback.currency) {
      return { currency: fallback.currency, options: fallbackActive, isConverted: false };
    }

    const converted = await convertOptions(fallbackActive, fallback.currency, requested);
    if (!converted) {
      return { currency: fallback.currency, options: fallbackActive, isConverted: false };
    }
    return { currency: requested, options: converted, isConverted: true };
  };

  const getPricingAdmin = async (currency) => {
    const requested = normalizeCode(currency);
    const exact = await findBook(requested);
    if (requested && !exact) {
      return { currency: requested, options: [], updatedAt: null, exists: false };
    }
    const book = exact || (await ensureDefaultBook());
    return {
      currency: book.currency,
      options: sortOptions(book.options),
      updatedAt: book.updatedAt,
      exists: true,
    };
  };

  const listPriceBooks = async () => {
    const [books, baseCode] = await Promise.all([
      TicketPricing.find({ key: KEY }).lean(),
      getBaseCode(),
    ]);
    return books
      .map((b) => ({
        currency: b.currency,
        options: sortOptions(b.options),
        updatedAt: b.updatedAt,
        isBaseCurrency: b.currency === baseCode,
      }))
      .sort((a, b) =>
        a.isBaseCurrency !== b.isBaseCurrency
          ? Number(b.isBaseCurrency) - Number(a.isBaseCurrency)
          : a.currency.localeCompare(b.currency),
      );
  };

  const updatePricing = async ({ currency, options, updatedBy }) => {
    const code = normalizeCode(currency) || (await getBaseCode());
    if (!normalizeCurrencyCode(code)) throw new AppError(`Invalid currency: ${code}`, 400);
    if (Currency && !(await Currency.exists({ code }))) {
      throw new AppError(`Unknown currency: ${code}`, 400);
    }
    const book = await TicketPricing.findOneAndUpdate(
      { key: KEY, currency: code },
      { $set: { options: sanitizeOptions(options, code), updatedBy: updatedBy || null } },
      { new: true, upsert: true },
    );
    return { currency: book.currency, options: sortOptions(book.options), updatedAt: book.updatedAt };
  };

  const deletePriceBook = async (currency) => {
    const code = normalizeCode(currency);
    if (!code) throw new AppError('Currency is required', 400);
    if (code === (await getBaseCode())) {
      throw new AppError('Cannot delete the base currency price book', 400);
    }
    const res = await TicketPricing.deleteOne({ key: KEY, currency: code });
    if (!res.deletedCount) throw new AppError(`No price book for ${code}`, 404);
    return { currency: code, deleted: true };
  };

  // Always returns a price in the requested currency when it can be reached, so callers never convert again.
  const getUnitPrice = async (ticketValidity, requestedCurrency) => {
    const requested = normalizeCurrencyCode(requestedCurrency);
    const exact = await findBook(requested);
    const exactOption = exact?.options.find((o) => o.validity === ticketValidity && o.isActive);

    if (exact && exactOption) {
      return { currency: exact.currency, unitPrice: exactOption.price, isExact: true };
    }

    const fallback = await ensureDefaultBook();
    const fallbackOption = fallback.options.find((o) => o.validity === ticketValidity && o.isActive);
    if (!fallbackOption) throw new AppError(`Pricing not configured for ${ticketValidity}`, 400);

    if (exact) {
      logger.info('[tickets] Validity missing from the price book, pricing from the base book', {
        validity: ticketValidity,
        requested: exact.currency,
        fallback: fallback.currency,
      });
    }

    if (!requested || requested === fallback.currency) {
      return { currency: fallback.currency, unitPrice: fallbackOption.price, isExact: false };
    }

    const converted = conversionService
      ? await conversionService.convert({
          amount: fallbackOption.price,
          fromCode: fallback.currency,
          toCode: requested,
        })
      : null;

    if (!converted) {
      return { currency: fallback.currency, unitPrice: fallbackOption.price, isExact: false };
    }

    return { currency: converted.currencyCode, unitPrice: converted.amount, isExact: false };
  };

  return {
    getPricingPublic,
    getPricingAdmin,
    listPriceBooks,
    updatePricing,
    deletePriceBook,
    getUnitPrice,
  };
}
