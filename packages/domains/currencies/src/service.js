import { AppError } from '@travel-suite/utils';

function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildSort(sort = 'base_first') {
  const map = {
    base_first: { isBaseCurrency: -1, code: 1 },
    code_asc: { code: 1 },
    code_desc: { code: -1 },
    rate_asc: { rate: 1 },
    rate_desc: { rate: -1 },
    updated_desc: { lastUpdated: -1, code: 1 },
    updated_asc: { lastUpdated: 1, code: 1 },
  };
  return map[sort] || map.base_first;
}

function isDuplicateKeyError(err) {
  return err?.code === 11000;
}

async function demoteOtherBases(Currency, keepId) {
  const filter = { isBaseCurrency: true };
  if (keepId) filter._id = { $ne: keepId };
  await Currency.updateMany(filter, { $set: { isBaseCurrency: false } });
}

export function createCurrencyService({ Currency, isCurrencyInUse }) {
  const getCurrencies = async (query = {}) => {
    const filter = {};
    const search = String(query.search || query.q || '').trim();
    if (search) {
      const regex = new RegExp(escapeRegex(search), 'i');
      filter.$or = [{ code: regex }, { name: regex }, { symbol: regex }];
    }
    if (query.baseOnly === 'true') filter.isBaseCurrency = true;
    return Currency.find(filter).sort(buildSort(query.sort));
  };

  const getCurrencyByCode = async (code) => {
    const currency = await Currency.findOne({ code: String(code).toUpperCase() });
    if (!currency) throw new AppError('Currency not found', 404);
    return currency;
  };

  const createCurrency = async ({ code, name, symbol, rate, isBaseCurrency, updatedBy }) => {
    if (!code || !name || !symbol) throw new AppError('Code, name, and symbol are required', 400);
    const normalizedCode = String(code).toUpperCase();
    if (await Currency.exists({ code: normalizedCode })) throw new AppError('Currency already exists', 400);

    const parsedRate = Number(rate ?? 1);
    if (!Number.isFinite(parsedRate) || parsedRate <= 0) throw new AppError('Rate must be a positive number', 400);

    const hasBase = await Currency.exists({ isBaseCurrency: true });
    const shouldBeBase = hasBase ? !!isBaseCurrency : true;

    let currency;
    try {
      currency = await Currency.create({
        code: normalizedCode,
        name: String(name).trim(),
        symbol: String(symbol).trim(),
        rate: shouldBeBase ? 1 : parsedRate,
        isBaseCurrency: false,
        updatedBy: updatedBy || null,
      });
    } catch (err) {
      if (isDuplicateKeyError(err)) throw new AppError('Currency already exists', 400);
      throw err;
    }

    if (!shouldBeBase) return currency;

    await demoteOtherBases(Currency, currency._id);
    currency.isBaseCurrency = true;
    await currency.save();

    return currency;
  };

  const updateCurrency = async (code, payload = {}, updatedBy = null) => {
    const currency = await Currency.findOne({ code: String(code).toUpperCase() });
    if (!currency) throw new AppError('Currency not found', 404);

    if ('name' in payload) currency.name = String(payload.name || '').trim();
    if ('symbol' in payload) currency.symbol = String(payload.symbol || '').trim();

    if ('rate' in payload) {
      const rate = Number(payload.rate);
      if (!Number.isFinite(rate) || rate <= 0) throw new AppError('Rate must be a positive number', 400);
      currency.rate = rate;
    }

    if ('isBaseCurrency' in payload) {
      if (payload.isBaseCurrency === false && currency.isBaseCurrency) {
        throw new AppError('Select another base currency before unsetting the current one', 400);
      }
      currency.isBaseCurrency = payload.isBaseCurrency;
    }

    if (currency.isBaseCurrency) currency.rate = 1;
    currency.lastUpdated = Date.now();
    currency.updatedBy = updatedBy || currency.updatedBy;

    if (currency.isBaseCurrency) await demoteOtherBases(Currency, currency._id);
    await currency.save();
    return currency;
  };

  const deleteCurrency = async (code) => {
    const currency = await Currency.findOne({ code: String(code).toUpperCase() });
    if (!currency) throw new AppError('Currency not found', 404);
    if (currency.isBaseCurrency) throw new AppError('Base currency cannot be deleted', 400);

    // Orders priced in a currency we can no longer convert drop out of every revenue and payout total.
    const inUse = await isCurrencyInUse?.(currency.code);
    if (inUse) throw new AppError(inUse, 409);

    await Currency.findOneAndDelete({ code: currency.code });
  };

  return { getCurrencies, getCurrencyByCode, createCurrency, updateCurrency, deleteCurrency };
}
