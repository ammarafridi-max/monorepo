import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createCurrencyConversionService } from '@travel-suite/currencies/conversion';
import { createPricingService } from '../src/pricing.service.js';
import { createTicketService } from '../src/service.js';
import { baseBook, currencyModel, pricingModel, usdBase } from './helpers.js';

function dateInDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const DEPARTURE = dateInDays(40);
const RETURN = dateInDays(47);

function flight(carrierCode, flightNumber) {
  return {
    duration: 'PT7H',
    segments: [
      {
        departure: { iataCode: 'DXB', date: DEPARTURE, time: '08:00' },
        arrival: { iataCode: 'LHR', date: DEPARTURE, time: '12:00' },
        carrierCode,
        flightNumber,
      },
    ],
  };
}

function basePayload(overrides = {}) {
  return {
    type: 'Return',
    from: 'DUBAI (DXB)',
    to: 'LONDON (LHR)',
    departureDate: DEPARTURE,
    returnDate: RETURN,
    quantity: { adults: 1, children: 0, infants: 0 },
    passengers: [{ type: 'Adult', title: 'Mr', firstName: 'Sam', lastName: 'Carter' }],
    email: 'sam@example.com',
    phoneNumber: { code: '+971', digits: '501234567' },
    ticketValidity: '7 Days',
    currency: 'AED',
    ticketDelivery: { immediate: true, deliveryDate: null },
    flightDetails: { departureFlight: flight('EK', '001'), returnFlight: flight('EK', '002') },
    ...overrides,
  };
}

function build({ ticket: overrides = {} } = {}) {
  const saves = [];

  const ticket = {
    _id: 'id1',
    sessionId: 's-1',
    email: 'sam@example.com',
    type: 'Return',
    from: 'DUBAI (DXB)',
    to: 'LONDON (LHR)',
    departureDate: DEPARTURE,
    returnDate: RETURN,
    ticketValidity: '7 Days',
    quantity: { adults: 1, children: 0, infants: 0 },
    passengers: [{ type: 'Adult', title: 'Mr', firstName: 'Sam', lastName: 'Carter' }],
    flightDetails: { departureFlight: flight('EK', '001'), returnFlight: flight('EK', '002') },
    currency: 'AED',
    paymentStatus: 'UNPAID',
    events: [],
    ...overrides,
  };

  ticket.toObject = () => ({ ...ticket });
  ticket.save = async function save() {
    saves.push({ ...this });
    return this;
  };

  const Ticket = {
    findOne: async () => ticket,
    findOneAndUpdate: async () => ticket,
    exists: async () => false,
    aggregate: async () => [],
  };

  const Currency = currencyModel(usdBase);
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
    notifications: { sendTicketPaymentToAdmin: async () => {} },
    frontendUrl: 'https://brand.example',
    paidOrderBus: { publish: () => {} },
  });

  return { service, ticket, saves };
}

describe('editing a booking before payment', () => {
  it('keeps the same session id instead of creating a second order', async () => {
    const { service, ticket } = build();

    const updated = await service.updateTicketRequest(
      's-1',
      basePayload({ flightDetails: { departureFlight: flight('BA', '106'), returnFlight: null }, type: 'One Way', returnDate: undefined }),
    );

    assert.equal(updated.sessionId, 's-1');
    assert.equal(ticket.sessionId, 's-1');
  });

  it('applies the new flight and passenger details', async () => {
    const { service } = build();

    const updated = await service.updateTicketRequest(
      's-1',
      basePayload({
        passengers: [{ type: 'Adult', title: 'Ms', firstName: 'Dana', lastName: 'Reed' }],
        flightDetails: { departureFlight: flight('BA', '106'), returnFlight: flight('BA', '107') },
      }),
    );

    assert.equal(updated.passengers[0].firstName, 'Dana');
    assert.equal(updated.flightDetails.departureFlight.segments[0].carrierCode, 'BA');
  });

  it('records what changed so the earlier details stay traceable', async () => {
    const { service, ticket } = build();

    await service.updateTicketRequest(
      's-1',
      basePayload({
        to: 'PARIS (CDG)',
        passengers: [{ type: 'Adult', title: 'Ms', firstName: 'Dana', lastName: 'Reed' }],
      }),
    );

    assert.equal(ticket.events.length, 1);
    const [event] = ticket.events;
    assert.equal(event.action, 'EDITED_BEFORE_PAYMENT');
    assert.match(event.detail, /To: LONDON \(LHR\) -> PARIS \(CDG\)/);
    assert.match(event.detail, /Passengers: Mr Sam Carter -> Ms Dana Reed/);
  });

  it('records nothing when the customer changes nothing', async () => {
    const { service, ticket } = build();
    await service.updateTicketRequest('s-1', basePayload());
    assert.equal(ticket.events.length, 0);
  });

  it('refuses to change an order that is already paid', async () => {
    const { service } = build({ ticket: { paymentStatus: 'PAID' } });

    await assert.rejects(
      () => service.updateTicketRequest('s-1', basePayload({ to: 'PARIS (CDG)' })),
      (error) => error.statusCode === 409 || error.status === 409,
    );
  });

  it('rejects an unknown session instead of silently creating one', async () => {
    const missing = createTicketService({
      Ticket: { findOne: async () => null, exists: async () => false, aggregate: async () => [] },
      Affiliate: { findById: () => ({ select: () => ({ lean: async () => null }) }) },
      pricingService: createPricingService({
        TicketPricing: pricingModel(baseBook()),
        Currency: currencyModel(usdBase),
        conversionService: createCurrencyConversionService({ Currency: currencyModel(usdBase) }),
      }),
      notifications: { sendTicketPaymentToAdmin: async () => {} },
      frontendUrl: 'https://brand.example',
      paidOrderBus: { publish: () => {} },
    });

    await assert.rejects(
      () => missing.updateTicketRequest('nope', basePayload()),
      (error) => error.statusCode === 404 || error.status === 404,
    );
  });

  it('still refuses details that do not add up', async () => {
    const { service } = build();

    await assert.rejects(
      () =>
        service.updateTicketRequest(
          's-1',
          basePayload({ quantity: { adults: 2, children: 0, infants: 0 } }),
        ),
      /passenger details do not match/i,
    );
  });
});
