import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createCurrencyConversionService } from '@travel-suite/currencies/conversion';
import { currencyModel, usdBase } from './helpers.js';

const service = () => createCurrencyConversionService({ Currency: currencyModel(usdBase) });

describe('base currency', () => {
  it('reads the configured base rather than assuming one', async () => {
    assert.deepEqual(await service().getBaseCurrency(), { code: 'USD', rate: 1 });
  });

  it('falls back only when no base is configured', async () => {
    const empty = createCurrencyConversionService({ Currency: currencyModel([]) });
    assert.equal((await empty.getBaseCurrency()).code, 'AED');
  });
});

describe('convert', () => {
  it('converts out of the base currency', async () => {
    assert.deepEqual(await service().convert({ amount: 19, fromCode: 'USD', toCode: 'AED' }), {
      amount: 69.78,
      currencyCode: 'AED',
      rate: 3.6725,
    });
  });

  it('converts back into the base currency', async () => {
    const result = await service().convertToBase({ amount: 209.33, sourceCode: 'AED' });
    assert.equal(result.currencyCode, 'USD');
    assert.equal(result.amount, 57);
  });

  it('rounds to what the target currency can hold', async () => {
    const yen = await service().convert({ amount: 19, fromCode: 'USD', toCode: 'JPY' });
    assert.equal(yen.amount, 2873);
    assert.equal(Number.isInteger(yen.amount), true);

    const dinar = await service().convert({ amount: 19, fromCode: 'USD', toCode: 'KWD' });
    assert.equal(dinar.amount, 5.81);
  });

  it('is a no-op between the same currency', async () => {
    assert.deepEqual(await service().convert({ amount: 10, fromCode: 'AED', toCode: 'AED' }), {
      amount: 10,
      currencyCode: 'AED',
      rate: 1,
    });
  });

  it('refuses rather than guessing when a currency is unknown', async () => {
    assert.equal(await service().convert({ amount: 10, fromCode: 'USD', toCode: 'ZZZ' }), null);
    assert.equal(await service().convertToBase({ amount: 10, sourceCode: 'NOK' }), null);
  });

  it('refuses when the amount is not a number', async () => {
    assert.equal(await service().convert({ amount: 'free', fromCode: 'USD', toCode: 'AED' }), null);
    assert.equal(await service().convertToBase({ amount: null, sourceCode: 'AED' }), null);
  });

  it('treats a broken rate as unusable', async () => {
    const broken = createCurrencyConversionService({
      Currency: currencyModel([{ code: 'USD', rate: 1, isBaseCurrency: true }, { code: 'BAD', rate: 0 }]),
    });
    assert.equal(await broken.convert({ amount: 10, fromCode: 'USD', toCode: 'BAD' }), null);
  });
});
