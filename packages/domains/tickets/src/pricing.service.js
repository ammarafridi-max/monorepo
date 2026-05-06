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

export function createPricingService({ TicketPricing }) {
  async function ensurePricing() {
    let config = await TicketPricing.findOne({ key: 'dummy-ticket' });
    if (config) return config;
    return TicketPricing.create({ key: 'dummy-ticket', currency: 'AED', options: DEFAULT_OPTIONS });
  }

  const getPricingPublic = async () => {
    const config = await ensurePricing();
    return { currency: config.currency, options: sortOptions(config.options).filter((o) => o.isActive) };
  };

  const getPricingAdmin = async () => {
    const config = await ensurePricing();
    return { currency: config.currency, options: sortOptions(config.options), updatedAt: config.updatedAt };
  };

  const updatePricing = async ({ currency, options, updatedBy }) => {
    const config = await ensurePricing();
    config.currency = String(currency || config.currency || 'AED').toUpperCase();
    config.options = sanitizeOptions(options);
    config.updatedBy = updatedBy || null;
    await config.save();
    return { currency: config.currency, options: sortOptions(config.options), updatedAt: config.updatedAt };
  };

  const getUnitPrice = async (ticketValidity) => {
    const config = await ensurePricing();
    const option = config.options.find((o) => o.validity === ticketValidity && o.isActive);
    if (!option) throw new AppError(`Pricing not configured for ${ticketValidity}`, 400);
    return { currency: config.currency || 'AED', unitPrice: option.price };
  };

  return { getPricingPublic, getPricingAdmin, updatePricing, getUnitPrice };
}
