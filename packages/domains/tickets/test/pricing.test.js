import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createCurrencyConversionService } from '@travel-suite/currencies/conversion';
import { createPricingService } from '../src/pricing.service.js';
import { baseBook, currencyModel, pricingModel, usdBase } from './helpers.js';

function build({ books = baseBook(), rows = usdBase, failFirstCreate = false } = {}) {
  const Currency = currencyModel(rows);
  const TicketPricing = pricingModel(books, { failFirstCreate });
  const conversionService = createCurrencyConversionService({ Currency });
  return {
    books,
    service: createPricingService({ TicketPricing, Currency, conversionService }),
  };
}

describe('public pricing', () => {
  it('serves a currency that has its own price book untouched', async () => {
    const { service, books } = build();
    books.push({
      key: 'dummy-ticket',
      currency: 'AED',
      options: [{ validity: '2 Days', price: 45, isActive: true, sortOrder: 0 }],
    });
    const pricing = await service.getPricingPublic('AED');
    assert.equal(pricing.currency, 'AED');
    assert.equal(pricing.isConverted, false);
    assert.deepEqual(pricing.options.map((o) => o.price), [45]);
  });

  it('converts the base book for a currency that has none', async () => {
    const { service } = build();
    const pricing = await service.getPricingPublic('AED');
    assert.equal(pricing.currency, 'AED');
    assert.equal(pricing.isConverted, true);
    assert.deepEqual(pricing.options.map((o) => o.price), [47.74, 69.78]);
  });

  it('hides options that are off sale', async () => {
    const { service } = build();
    const pricing = await service.getPricingPublic('USD');
    assert.deepEqual(pricing.options.map((o) => o.validity), ['2 Days', '7 Days']);
  });

  it('falls back to the base book when every option in the asked-for book is off sale', async () => {
    const { service, books } = build();
    books.push({
      key: 'dummy-ticket',
      currency: 'AED',
      options: [{ validity: '2 Days', price: 45, isActive: false, sortOrder: 0 }],
    });
    const pricing = await service.getPricingPublic('AED');
    assert.equal(pricing.options.length, 2);
    assert.equal(pricing.isConverted, true);
  });

  it('serves the base book when the currency is unknown', async () => {
    const { service } = build();
    const pricing = await service.getPricingPublic('ZZZ');
    assert.equal(pricing.currency, 'USD');
    assert.equal(pricing.isConverted, false);
  });

  it('survives two first requests racing to seed the default book', async () => {
    const { service } = build({ books: [], failFirstCreate: true });
    const pricing = await service.getPricingPublic('USD');
    assert.equal(pricing.currency, 'USD');
    assert.ok(pricing.options.length > 0);
  });
});

describe('unit price', () => {
  it('prices from the currency the buyer asked for', async () => {
    const { service } = build();
    assert.deepEqual(await service.getUnitPrice('7 Days', 'AED'), {
      currency: 'AED',
      unitPrice: 69.78,
      isExact: false,
    });
  });

  it('prefers that currency own book when it has the validity', async () => {
    const { service, books } = build();
    books.push({
      key: 'dummy-ticket',
      currency: 'AED',
      options: [{ validity: '7 Days', price: 65, isActive: true, sortOrder: 0 }],
    });
    assert.deepEqual(await service.getUnitPrice('7 Days', 'AED'), {
      currency: 'AED',
      unitPrice: 65,
      isExact: true,
    });
  });

  it('falls back to the base book for a validity that book is missing', async () => {
    const { service, books } = build();
    books.push({
      key: 'dummy-ticket',
      currency: 'AED',
      options: [{ validity: '2 Days', price: 45, isActive: true, sortOrder: 0 }],
    });
    const price = await service.getUnitPrice('7 Days', 'AED');
    assert.equal(price.currency, 'AED');
    assert.equal(price.unitPrice, 69.78);
    assert.equal(price.isExact, false);
  });

  it('gives whole units for a currency that has no minor unit', async () => {
    const { service } = build();
    const price = await service.getUnitPrice('7 Days', 'JPY');
    assert.equal(price.unitPrice, 2873);
  });

  it('refuses a validity that is off sale everywhere', async () => {
    const { service } = build();
    await assert.rejects(() => service.getUnitPrice('14 Days', 'USD'), /Pricing not configured/);
  });
});

describe('admin pricing', () => {
  it('reports a currency with no book rather than inventing one', async () => {
    const { service } = build();
    assert.deepEqual(await service.getPricingAdmin('AED'), {
      currency: 'AED',
      options: [],
      updatedAt: null,
      exists: false,
    });
  });

  it('refuses a price of zero on a validity that is on sale', async () => {
    const { service } = build();
    await assert.rejects(
      () => service.updatePricing({ currency: 'USD', options: [{ validity: '2 Days', price: 0, isActive: true }] }),
      /needs a price above zero/,
    );
  });

  it('allows a price of zero once the validity is off sale', async () => {
    const { service } = build();
    const saved = await service.updatePricing({
      currency: 'USD',
      options: [
        { validity: '2 Days', price: 0, isActive: false },
        { validity: '7 Days', price: 19, isActive: true },
      ],
    });
    assert.equal(saved.options[0].price, 0);
  });

  it('rejects an unknown or malformed currency', async () => {
    const { service } = build();
    await assert.rejects(
      () => service.updatePricing({ currency: 'US', options: [{ validity: '2 Days', price: 5 }] }),
      /Invalid currency/,
    );
    await assert.rejects(
      () => service.updatePricing({ currency: 'ZZZ', options: [{ validity: '2 Days', price: 5 }] }),
      /Unknown currency/,
    );
  });

  it('rounds a stored price to what that currency can charge', async () => {
    const { service } = build();
    const saved = await service.updatePricing({
      currency: 'JPY',
      options: [{ validity: '2 Days', price: 2034.7, isActive: true }],
    });
    assert.equal(saved.options[0].price, 2035);
  });

  it('will not delete the base currency price book', async () => {
    const { service } = build();
    await assert.rejects(() => service.deletePriceBook('USD'), /Cannot delete the base currency/);
  });
});
