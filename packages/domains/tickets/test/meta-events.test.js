import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createCurrencyConversionService } from '@travel-suite/currencies/conversion';
import { createPricingService } from '../src/pricing.service.js';
import { createTicketService } from '../src/service.js';
import { baseBook, currencyModel, pricingModel, usdBase } from './helpers.js';

const flush = async () => {
  for (let i = 0; i < 5; i += 1) await new Promise((resolve) => setImmediate(resolve));
};

function build({ ticket: overrides = {}, capi = {}, rows = usdBase } = {}) {
  const ticket = {
    _id: 'id1',
    sessionId: 's-1',
    email: '  Traveller@Example.COM ',
    type: 'One Way',
    from: 'DXB',
    to: 'LHR',
    ticketValidity: '7 Days',
    quantity: { adults: 2, children: 1, infants: 1 },
    currency: 'AED',
    paymentStatus: 'UNPAID',
    phoneNumber: { code: '+971', digits: '0501234567' },
    passengers: [{ title: 'Mr.', firstName: 'Amir', lastName: 'Khan' }],
    metaAttribution: {},
    ...overrides,
  };

  const Ticket = {
    findOne: () => {
      const result = Promise.resolve(ticket);
      result.select = () => Promise.resolve(ticket);
      result.populate = () => Promise.resolve(ticket);
      return result;
    },
    findOneAndUpdate: async (_query, update) => {
      const merged = { ...ticket, ...(update.$set ?? {}) };
      merged.populate = () => merged;
      return merged;
    },
    exists: async () => false,
    aggregate: async () => [],
    updateOne: async () => ({}),
    create: async (doc) => ({ ...ticket, ...doc, sessionId: 's-new', createdAt: new Date() }),
  };

  const events = [];
  const configured = capi.configured ?? true;
  const metaCapi = {
    isConfigured: () => configured,
    trackPurchase: async (payload) => {
      events.push({ name: 'Purchase', ...payload });
      if (capi.failPurchase) throw new Error('capi down');
      return {};
    },
    trackInitiateCheckout: async (payload) => {
      events.push({ name: 'InitiateCheckout', ...payload });
      if (capi.failCheckout) throw new Error('capi down');
      return {};
    },
    trackLead: async (payload) => {
      events.push({ name: 'Lead', ...payload });
      return {};
    },
  };

  const Currency = currencyModel(rows);
  const conversionService = createCurrencyConversionService({ Currency });

  const service = createTicketService({
    Ticket,
    Affiliate: {
      findById: () => ({ select: () => ({ lean: async () => null }) }),
      findOne: () => ({ select: async () => null }),
    },
    pricingService: createPricingService({
      TicketPricing: pricingModel(baseBook()),
      Currency,
      conversionService,
    }),
    currencyService: conversionService,
    stripe: {
      checkout: {
        sessions: { create: async () => ({ id: 'cs_test', url: 'https://stripe.example/pay' }) },
      },
    },
    paypal: { createOrder: async () => ({ orderId: 'o1', approveUrl: 'https://paypal.example/pay' }) },
    notifications: { sendTicketPaymentToAdmin: async () => {}, sendTicketPaymentToCustomer: async () => {} },
    frontendUrl: 'https://brand.example',
    paidOrderBus: { publish: () => {} },
    metaCapi,
  });

  return { service, events, ticket };
}

const find = (events, name) => events.find((e) => e.name === name);

describe('Meta checkout signal', () => {
  it('reports InitiateCheckout when a Stripe checkout is opened', async () => {
    const { service, events } = build();
    await service.createStripePaymentUrl({ sessionId: 's-1', currencyCode: 'AED' });

    const event = find(events, 'InitiateCheckout');
    assert.ok(event, 'an InitiateCheckout event should be sent');
    assert.equal(event.eventId, 'dummy-ticket-checkout:s-1');
    assert.equal(event.currency, 'AED');
    assert.equal(event.value, 209.34);
    assert.equal(event.numItems, 3, 'infants do not pay, so they are not counted');
  });

  it('reports InitiateCheckout when a PayPal order is opened', async () => {
    const { service, events } = build();
    await service.createPayPalOrder({ sessionId: 's-1' });

    const event = find(events, 'InitiateCheckout');
    assert.ok(event);
    assert.equal(event.eventId, 'dummy-ticket-checkout:s-1');
  });

  it('uses a different event id from the purchase, so the two never collapse', async () => {
    const { service, events } = build();
    await service.createStripePaymentUrl({ sessionId: 's-1', currencyCode: 'AED' });
    await service.handleStripeSuccess({
      payment_status: 'paid',
      currency: 'aed',
      amount_total: 20934,
      id: 'pi_1',
      metadata: { sessionId: 's-1' },
    });
    await flush();

    assert.equal(find(events, 'InitiateCheckout').eventId, 'dummy-ticket-checkout:s-1');
    assert.equal(find(events, 'Purchase').eventId, 'dummy-ticket:s-1');
  });

  it('sends gender and country alongside the contact details', async () => {
    const { service, events } = build();
    await service.createStripePaymentUrl({ sessionId: 's-1', currencyCode: 'AED' });

    const { user } = find(events, 'InitiateCheckout');
    assert.equal(user.gender, 'm', 'derived from the Mr. title');
    assert.equal(user.country, 'AE', 'derived from the +971 dialling code');
    assert.equal(user.phone, '971501234567', 'E.164 with the trunk zero dropped');
    assert.equal(user.firstName, 'Amir');
    assert.equal(user.lastName, 'Khan');
    assert.equal(user.externalId, 'traveller@example.com');
  });

  it('resolves the shared +1 range using the charged currency', async () => {
    const { service, events } = build({
      ticket: { phoneNumber: { code: '+1', digits: '5554911850' }, currency: 'CAD' },
      rows: [...usdBase, { code: 'CAD', rate: 1.37 }],
    });
    await service.createStripePaymentUrl({ sessionId: 's-1', currencyCode: 'CAD' });
    assert.equal(find(events, 'InitiateCheckout').user.country, 'CA');
  });

  it('omits gender and country rather than guessing them', async () => {
    const { service, events } = build({
      ticket: {
        phoneNumber: { code: '+999', digits: '5551234' },
        passengers: [{ title: 'Dr.', firstName: 'Amir', lastName: 'Khan' }],
      },
    });
    await service.createStripePaymentUrl({ sessionId: 's-1', currencyCode: 'AED' });

    const { user } = find(events, 'InitiateCheckout');
    assert.equal(user.gender, undefined);
    assert.equal(user.country, undefined);
  });

  it('carries gender and country on the purchase event too', async () => {
    const { service, events } = build();
    await service.handleStripeSuccess({
      payment_status: 'paid',
      currency: 'aed',
      amount_total: 20934,
      id: 'pi_1',
      metadata: { sessionId: 's-1' },
    });
    await flush();

    const { user } = find(events, 'Purchase');
    assert.equal(user.gender, 'm');
    assert.equal(user.country, 'AE');
  });

  it('still opens checkout when the Meta call fails', async () => {
    const { service, events } = build({ capi: { failCheckout: true } });
    const session = await service.createStripePaymentUrl({ sessionId: 's-1', currencyCode: 'AED' });

    assert.equal(session.url, 'https://stripe.example/pay', 'the customer still reaches Stripe');
    assert.ok(find(events, 'InitiateCheckout'), 'the attempt was made');
  });

  it('sends nothing when Meta is not configured', async () => {
    const { service, events } = build({ capi: { configured: false } });
    const session = await service.createStripePaymentUrl({ sessionId: 's-1', currencyCode: 'AED' });

    assert.equal(session.url, 'https://stripe.example/pay');
    assert.equal(events.length, 0);
  });
});

describe('Meta lead signal', () => {
  const order = {
    type: 'One Way',
    from: 'DXB',
    to: 'LHR',
    departureDate: '2027-01-01',
    ticketValidity: '7 Days',
    quantity: { adults: 2, children: 1, infants: 0 },
    passengers: [
      { type: 'Adult', title: 'Mr.', firstName: 'Amir', lastName: 'Khan' },
      { type: 'Adult', title: 'Mrs.', firstName: 'Sara', lastName: 'Khan' },
      { type: 'Child', title: 'Ms.', firstName: 'Lina', lastName: 'Khan' },
    ],
    email: 'traveller@example.com',
    phoneNumber: { code: '+971', digits: '0501234567' },
    ticketDelivery: { immediate: true },
    currency: 'AED',
  };

  it('reports a Lead keyed on the id the browser used', async () => {
    const { service, events } = build();
    await service.createTicketRequest({ ...order, leadEventId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
    await flush();

    const lead = find(events, 'Lead');
    assert.ok(lead, 'a Lead event should be sent');
    assert.equal(lead.eventId, 'dummy-ticket-lead:a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d');
    assert.equal(lead.user.gender, 'm');
    assert.equal(lead.user.country, 'AE');
  });

  it('sends no Lead when the browser supplied no id, rather than double counting', async () => {
    const { service, events } = build();
    await service.createTicketRequest(order);
    await flush();
    assert.equal(find(events, 'Lead'), undefined);
  });

  it('refuses an id that is not a plain key, so the namespace cannot be spoofed', async () => {
    const { service, events } = build();
    await service.createTicketRequest({ ...order, leadEventId: 'dummy-ticket:s-1' });
    await flush();
    assert.equal(find(events, 'Lead'), undefined);
  });
});

describe('Meta click id recovery', () => {
  it('rebuilds fbc from a stored fbclid when the cookie was lost', async () => {
    const capturedAt = new Date('2026-10-01T00:00:00.000Z');
    const { service, events } = build({
      ticket: {
        metaAttribution: {},
        attribution: { last: { fbclid: 'IwAR123abc', capturedAt } },
      },
    });
    await service.createStripePaymentUrl({ sessionId: 's-1', currencyCode: 'AED' });

    assert.equal(find(events, 'InitiateCheckout').user.fbc, `fb.1.${capturedAt.getTime()}.IwAR123abc`);
  });

  it('keeps the real fbc the browser sent over a rebuilt one', async () => {
    const { service, events } = build({
      ticket: { attribution: { last: { fbclid: 'IwAR123abc', capturedAt: new Date() } } },
    });
    await service.createStripePaymentUrl({
      sessionId: 's-1',
      currencyCode: 'AED',
      fbc: 'fb.1.999.realcookie',
    });
    assert.equal(find(events, 'InitiateCheckout').user.fbc, 'fb.1.999.realcookie');
  });

  it('sends no fbc when there was never a click id', async () => {
    const { service, events } = build();
    await service.createStripePaymentUrl({ sessionId: 's-1', currencyCode: 'AED' });
    assert.equal(find(events, 'InitiateCheckout').user.fbc, undefined);
  });
});
