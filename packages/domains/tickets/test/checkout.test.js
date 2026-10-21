import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createCurrencyConversionService } from '@travel-suite/currencies/conversion';
import { createPricingService } from '../src/pricing.service.js';
import { createTicketService } from '../src/service.js';
import { baseBook, currencyModel, pricingModel, usdBase } from './helpers.js';

function build({ ticket: overrides = {}, rows = usdBase } = {}) {
  const ticket = {
    _id: 'id1',
    sessionId: 's-1',
    email: 'traveller@example.com',
    type: 'Return',
    from: 'DXB',
    to: 'LHR',
    ticketValidity: '7 Days',
    quantity: { adults: 2, children: 1, infants: 1 },
    currency: 'AED',
    paymentStatus: 'UNPAID',
    passengers: [{ firstName: 'A', lastName: 'B' }],
    ...overrides,
  };

  const writes = [];
  const Ticket = {
    findOne: () => {
      const result = Promise.resolve(ticket);
      result.select = () => Promise.resolve(ticket);
      result.populate = () => Promise.resolve(ticket);
      return result;
    },
    findOneAndUpdate: async (_query, update) => {
      writes.push(update.$set ?? {});
      const merged = { ...ticket, ...(update.$set ?? {}) };
      merged.populate = () => merged;
      return merged;
    },
    exists: async () => false,
    aggregate: async () => [],
  };

  const stripeSessions = [];
  const payPalOrders = [];
  const Currency = currencyModel(rows);
  const conversionService = createCurrencyConversionService({ Currency });

  const service = createTicketService({
    Ticket,
    Affiliate: { findById: () => ({ select: () => ({ lean: async () => null }) }) },
    pricingService: createPricingService({
      TicketPricing: pricingModel(baseBook()),
      Currency,
      conversionService,
    }),
    currencyService: conversionService,
    stripe: {
      checkout: {
        sessions: {
          create: async (params, options) => {
            stripeSessions.push({ params, options });
            return { id: 'cs_test', url: 'https://stripe.example/pay' };
          },
        },
      },
    },
    paypal: {
      createOrder: async (args) => {
        payPalOrders.push(args);
        return { orderId: 'o1', approveUrl: 'https://paypal.example/pay' };
      },
    },
    notifications: { sendTicketPaymentToAdmin: async () => {} },
    frontendUrl: 'https://brand.example',
    paidOrderBus: { publish: () => {} },
  });

  return { service, stripeSessions, payPalOrders, writes };
}

describe('quoting an order', () => {
  it('prices three paying passengers, infants free', async () => {
    const { service } = build();
    const quote = await service.getTicketQuote('s-1', 'AED');
    assert.equal(quote.passengers, 3);
    assert.equal(quote.unitPrice, 69.78);
    assert.equal(quote.totalAmount, 209.34);
    assert.equal(quote.currency, 'AED');
  });

  it('tells the caller what PayPal would charge instead', async () => {
    const { service } = build();
    const { payPal } = await service.getTicketQuote('s-1', 'AED');
    assert.deepEqual(payPal, { currency: 'USD', unitPrice: 19, totalAmount: 57 });
  });

  it('quotes PayPal in the buyer currency when PayPal takes it', async () => {
    const { service } = build();
    const { payPal } = await service.getTicketQuote('s-1', 'JPY');
    assert.equal(payPal.currency, 'JPY');
    assert.equal(payPal.totalAmount, 8619);
  });
});

describe('stripe checkout', () => {
  it('sends cents for a two decimal currency', async () => {
    const { service, stripeSessions } = build();
    await service.createStripePaymentUrl({ sessionId: 's-1', currencyCode: 'AED' });
    const price = stripeSessions[0].params.line_items[0].price_data;
    assert.equal(price.currency, 'aed');
    assert.equal(price.unit_amount, 20934);
  });

  it('sends whole yen, never yen times one hundred', async () => {
    const { service, stripeSessions } = build();
    await service.createStripePaymentUrl({ sessionId: 's-1', currencyCode: 'JPY' });
    const price = stripeSessions[0].params.line_items[0].price_data;
    assert.equal(price.currency, 'jpy');
    assert.equal(price.unit_amount, 8619);
  });

  it('keys idempotency on what the buyer can change, so a currency switch is a new session', async () => {
    const { service, stripeSessions } = build();
    await service.createStripePaymentUrl({ sessionId: 's-1', currencyCode: 'AED' });
    await service.createStripePaymentUrl({ sessionId: 's-1', currencyCode: 'USD' });
    const keys = stripeSessions.map((s) => s.options.idempotencyKey);
    assert.deepEqual(keys, ['s-1:AED:20934', 's-1:USD:5700']);
  });

  it('stores the currency it actually charged', async () => {
    const { service, writes } = build();
    await service.createStripePaymentUrl({ sessionId: 's-1', currencyCode: 'AED' });
    assert.equal(writes[0].currency, 'AED');
    assert.equal(writes[0].totalAmount, 209.34);
  });
});

describe('paypal checkout', () => {
  it('falls back to USD when PayPal cannot take the buyer currency', async () => {
    const { service, payPalOrders } = build();
    await service.createPayPalOrder({ sessionId: 's-1', currencyCode: 'AED' });
    assert.equal(payPalOrders[0].currency, 'USD');
    assert.equal(payPalOrders[0].amount, 57);
  });

  it('keeps the buyer currency when PayPal takes it', async () => {
    const { service, payPalOrders } = build();
    await service.createPayPalOrder({ sessionId: 's-1', currencyCode: 'JPY' });
    assert.equal(payPalOrders[0].currency, 'JPY');
    assert.equal(payPalOrders[0].amount, 8619);
  });

  it('varies the request id with the amount so a changed order is not deduped', async () => {
    const { service, payPalOrders } = build();
    await service.createPayPalOrder({ sessionId: 's-1', currencyCode: 'AED' });
    assert.equal(payPalOrders[0].requestId, 's-1:USD:57');
  });
});

describe('stripe webhook', () => {
  const paidSession = (currency, amountTotal) => ({
    payment_status: 'paid',
    id: 'cs_1',
    currency,
    amount_total: amountTotal,
    metadata: { sessionId: 's-1' },
  });

  it('reads a two decimal amount back correctly and records the base amount', async () => {
    const { service, writes } = build();
    await service.handleStripeSuccess(paidSession('aed', 20933));
    const paid = writes.find((w) => w.amountPaid);
    assert.deepEqual(paid.amountPaid, { currency: 'AED', amount: 209.33 });
    assert.equal(paid.amountPaidBase.currency, 'USD');
    assert.equal(paid.amountPaidBase.amount, 57);
  });

  it('reads whole yen as yen, not as a hundredth of one', async () => {
    const { service, writes } = build();
    await service.handleStripeSuccess(paidSession('jpy', 8619));
    const paid = writes.find((w) => w.amountPaid);
    assert.deepEqual(paid.amountPaid, { currency: 'JPY', amount: 8619 });
  });

  it('still records the payment when the currency cannot be converted', async () => {
    const { service, writes } = build();
    await service.handleStripeSuccess(paidSession('nok', 50000));
    const paid = writes.find((w) => w.amountPaid);
    assert.deepEqual(paid.amountPaid, { currency: 'NOK', amount: 500 });
    assert.equal(paid.amountPaidBase, undefined);
  });

  it('ignores a session that was not paid', async () => {
    const { service, writes } = build();
    await service.handleStripeSuccess({ ...paidSession('aed', 20933), payment_status: 'unpaid' });
    assert.equal(writes.length, 0);
  });

  it('refuses a session with no amount rather than booking a free order', async () => {
    const { service } = build();
    await assert.rejects(() => service.handleStripeSuccess(paidSession('aed', null)), /amount_total/);
  });
});
