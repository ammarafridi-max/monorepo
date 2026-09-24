import { AppError } from '@travel-suite/utils';

const DEFAULT_OPTIONS = [
  { validity: '2 Days', price: 49, isActive: true, sortOrder: 0 },
  { validity: '7 Days', price: 69, isActive: true, sortOrder: 1 },
  { validity: '14 Days', price: 79, isActive: true, sortOrder: 2 },
];
const ALLOWED_VALIDITIES = new Set(DEFAULT_OPTIONS.map((o) => o.validity));

function sortOptions(options = []) {
  return [...options].sort((a, b) =>
    a.sortOrder !== b.sortOrder ? a.sortOrder - b.sortOrder : a.validity.localeCompare(b.validity),
  );
}

function sanitizeOptions(options = []) {
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
    seen.add(validity);
    return { validity, price: Number(price.toFixed(2)), isActive, sortOrder };
  });
  return sortOptions(sanitized);
}

const normalizeCode = (code) => String(code || '').trim().toUpperCase();

export function createPricingService({ TicketPricing, Currency }) {
  const getBaseCode = async () => {
    const base = await Currency?.findOne({ isBaseCurrency: true }).lean();
    return base?.code || 'AED';
  };

  // Only the base currency's book is auto-created. Every other currency is
  // opt-in, so a missing book means "fall back", never "invent a price".
  async function ensureDefaultBook() {
    const code = await getBaseCode();
    const onBase = await TicketPricing.findOne({ key: 'dummy-ticket', currency: code });
    if (onBase) return onBase;
    const any = await TicketPricing.findOne({ key: 'dummy-ticket' });
    if (any) return any;
    return TicketPricing.create({ key: 'dummy-ticket', currency: code, options: DEFAULT_OPTIONS });
  }

  const findBook = async (code) => {
    const c = normalizeCode(code);
    return c ? TicketPricing.findOne({ key: 'dummy-ticket', currency: c }) : null;
  };

  const getPricingPublic = async (currency) => {
    const book = (await findBook(currency)) || (await ensureDefaultBook());
    return {
      currency: book.currency,
      options: sortOptions(book.options).filter((o) => o.isActive),
    };
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
      TicketPricing.find({ key: 'dummy-ticket' }).lean(),
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
    // A book for a currency the brand does not list could never be charged,
    // and a typo would create one nobody notices.
    if (Currency && !(await Currency.exists({ code }))) {
      throw new AppError(`Unknown currency: ${code}`, 400);
    }
    const book = await TicketPricing.findOneAndUpdate(
      { key: 'dummy-ticket', currency: code },
      { $set: { options: sanitizeOptions(options), updatedBy: updatedBy || null } },
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
    const res = await TicketPricing.deleteOne({ key: 'dummy-ticket', currency: code });
    if (!res.deletedCount) throw new AppError(`No price book for ${code}`, 404);
    return { currency: code, deleted: true };
  };

  // isExact tells checkout whether this price was set for the requested
  // currency or merely fell back, which decides if FX conversion applies.
  const getUnitPrice = async (ticketValidity, requestedCurrency) => {
    const exact = await findBook(requestedCurrency);
    const book = exact || (await ensureDefaultBook());
    const option = book.options.find((o) => o.validity === ticketValidity && o.isActive);
    if (!option) throw new AppError(`Pricing not configured for ${ticketValidity}`, 400);
    return { currency: book.currency, unitPrice: option.price, isExact: Boolean(exact) };
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
