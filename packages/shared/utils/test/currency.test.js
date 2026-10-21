import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  currencyDecimals,
  fromStripeMinorUnits,
  normalizeCurrencyCode,
  payableDecimals,
  roundToCurrency,
  toFixedForCurrency,
  toStripeMinorUnits,
} from '../src/currency.js';

describe('normalizeCurrencyCode', () => {
  it('accepts a three letter code in any case', () => {
    assert.equal(normalizeCurrencyCode('aed'), 'AED');
    assert.equal(normalizeCurrencyCode(' usd '), 'USD');
  });

  it('rejects anything else', () => {
    for (const value of ['', 'US', 'USDX', '12A', null, undefined, 7, {}]) {
      assert.equal(normalizeCurrencyCode(value), null);
    }
  });
});

describe('currencyDecimals', () => {
  it('knows the zero decimal currencies', () => {
    for (const code of ['JPY', 'KRW', 'VND', 'XOF', 'CLP']) {
      assert.equal(currencyDecimals(code), 0, code);
    }
  });

  it('knows the three decimal currencies', () => {
    for (const code of ['KWD', 'BHD', 'OMR', 'JOD', 'TND']) {
      assert.equal(currencyDecimals(code), 3, code);
    }
  });

  it('defaults to two, including for an unknown code', () => {
    assert.equal(currencyDecimals('AED'), 2);
    assert.equal(currencyDecimals('ZZZ'), 2);
    assert.equal(currencyDecimals(undefined), 2);
  });

  it('never quotes more precision than a gateway will take', () => {
    assert.equal(payableDecimals('KWD'), 2);
    assert.equal(payableDecimals('JPY'), 0);
    assert.equal(payableDecimals('AED'), 2);
  });
});

describe('toStripeMinorUnits', () => {
  it('sends whole yen, not yen times one hundred', () => {
    assert.equal(toStripeMinorUnits(1481, 'JPY'), 1481);
    assert.equal(toStripeMinorUnits(1480.6, 'JPY'), 1481);
  });

  it('sends fils divisible by ten, which is all Stripe accepts', () => {
    assert.equal(toStripeMinorUnits(4.092, 'KWD'), 4090);
    assert.equal(toStripeMinorUnits(4.097, 'KWD'), 4100);
    assert.equal(toStripeMinorUnits(4.09, 'KWD') % 10, 0);
  });

  it('sends cents for a two decimal currency', () => {
    assert.equal(toStripeMinorUnits(49, 'AED'), 4900);
    assert.equal(toStripeMinorUnits(13.335, 'USD'), 1334);
  });

  it('returns null for an amount that is not a number', () => {
    assert.equal(toStripeMinorUnits('abc', 'AED'), null);
    assert.equal(toStripeMinorUnits(undefined, 'AED'), null);
    assert.equal(toStripeMinorUnits(Infinity, 'AED'), null);
  });
});

describe('fromStripeMinorUnits', () => {
  it('reads a webhook amount back in the right scale', () => {
    assert.equal(fromStripeMinorUnits(8619, 'JPY'), 8619);
    assert.equal(fromStripeMinorUnits(20933, 'AED'), 209.33);
    assert.equal(fromStripeMinorUnits(4095, 'KWD'), 4.095);
  });

  it('returns null when there is no usable amount', () => {
    assert.equal(fromStripeMinorUnits(undefined, 'AED'), null);
    assert.equal(fromStripeMinorUnits(null, 'AED'), null);
  });
});

describe('quoting and charging agree', () => {
  it('round trips every currency shape without drift', () => {
    const cases = [
      [49, 'AED'],
      [13.335, 'USD'],
      [1480.6, 'JPY'],
      [4.092, 'KWD'],
      [235000, 'IDR'],
      [0.5, 'JPY'],
    ];
    for (const [amount, code] of cases) {
      const quoted = roundToCurrency(amount, code);
      const charged = fromStripeMinorUnits(toStripeMinorUnits(amount, code), code);
      assert.equal(charged, quoted, `${code} ${amount}`);
    }
  });

  it('formats to the number of decimals it can charge', () => {
    assert.equal(toFixedForCurrency(1480.6, 'JPY'), '1481');
    assert.equal(toFixedForCurrency(4.092, 'KWD'), '4.09');
    assert.equal(toFixedForCurrency(49, 'AED'), '49.00');
  });
});
