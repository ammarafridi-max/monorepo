import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildAudiences, createAudienceService } from '../src/audience.service.js';

const NOW = new Date('2026-10-28T00:00:00.000Z');
const daysAgo = (n) => new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000);
const RATES = { USD: 1, AED: 3.6725, INR: 95.55 };

const ticket = (overrides = {}) => ({
  email: 'buyer@example.com',
  phoneNumber: { code: '+971', digits: '0501234567' },
  passengers: [{ title: 'Mr.', firstName: 'Amir', lastName: 'Khan' }],
  paymentStatus: 'PAID',
  paidAt: daysAgo(10),
  createdAt: daysAgo(10),
  amountPaid: { currency: 'AED', amount: 73.45 },
  currency: 'AED',
  ...overrides,
});

const parse = (csv) => csv.trim().split('\n').slice(1);

describe('audience segmentation', () => {
  it('splits buyers from people who never bought', () => {
    const out = buildAudiences(
      [
        ticket({ email: 'bought@example.com' }),
        ticket({ email: 'left@example.com', paymentStatus: 'UNPAID', paidAt: null }),
      ],
      { rates: RATES, now: NOW },
    );

    assert.equal(out.purchasers.rows, 1);
    assert.equal(out.abandoners.rows, 1);
    assert.match(out.purchasers.csv, /bought@example\.com/);
    assert.match(out.abandoners.csv, /left@example\.com/);
  });

  it('does not treat someone who later bought as an abandoner', () => {
    const out = buildAudiences(
      [
        ticket({ email: 'both@example.com', paymentStatus: 'UNPAID', paidAt: null }),
        ticket({ email: 'both@example.com' }),
      ],
      { rates: RATES, now: NOW },
    );

    assert.equal(out.purchasers.rows, 1);
    assert.equal(out.abandoners.rows, 0);
  });

  it('leaves refunders out of both lists', () => {
    const out = buildAudiences(
      [ticket({ email: 'refunded@example.com', paymentStatus: 'REFUNDED' })],
      { rates: RATES, now: NOW },
    );

    assert.equal(out.purchasers.rows, 0);
    assert.equal(out.abandoners.rows, 0);
  });

  it('keeps only recent abandoners in the recency file', () => {
    const out = buildAudiences(
      [
        ticket({ email: 'fresh@example.com', paymentStatus: 'UNPAID', paidAt: null, createdAt: daysAgo(10) }),
        ticket({ email: 'stale@example.com', paymentStatus: 'UNPAID', paidAt: null, createdAt: daysAgo(400) }),
      ],
      { rates: RATES, now: NOW },
    );

    assert.equal(out.abandoners.rows, 2, 'the full list keeps both');
    assert.equal(out.recentAbandoners.rows, 1, 'the recent list drops the stale one');
    assert.match(out.recentAbandoners.csv, /fresh@example\.com/);
    assert.doesNotMatch(out.recentAbandoners.csv, /stale@example\.com/);
  });

  it('treats the same address in different cases as one person', () => {
    const out = buildAudiences(
      [ticket({ email: 'Buyer@Example.COM' }), ticket({ email: ' buyer@example.com ' })],
      { rates: RATES, now: NOW },
    );

    assert.equal(out.purchasers.rows, 1);
    assert.equal(parse(out.purchasers.csv)[0].split(',')[0], 'buyer@example.com');
  });

  it('skips a row that is not a usable email', () => {
    const out = buildAudiences(
      [ticket({ email: 'not-an-email' }), ticket({ email: '' }), ticket({ email: null })],
      { rates: RATES, now: NOW },
    );
    assert.equal(out.purchasers.rows, 0);
  });
});

describe('audience lifetime value', () => {
  it('sums a repeat buyer into one row', () => {
    const out = buildAudiences(
      [
        ticket({ amountPaid: { currency: 'USD', amount: 20 }, amountPaidBase: null }),
        ticket({ amountPaid: { currency: 'USD', amount: 30 }, amountPaidBase: null }),
      ],
      { rates: RATES, now: NOW },
    );

    assert.equal(out.purchasers.rows, 1);
    assert.equal(parse(out.purchasers.csv)[0].split(',').at(-1), '50.00');
  });

  it('converts every currency to the base before adding them up', () => {
    const out = buildAudiences(
      [
        ticket({ amountPaid: { currency: 'AED', amount: 73.45 } }),
        ticket({ amountPaid: { currency: 'INR', amount: 955.5 } }),
      ],
      { rates: RATES, now: NOW },
    );

    assert.equal(parse(out.purchasers.csv)[0].split(',').at(-1), '30.00');
  });

  it('prefers the amount already recorded in the base currency', () => {
    const out = buildAudiences(
      [ticket({ amountPaid: { currency: 'AED', amount: 73.45 }, amountPaidBase: { amount: 19 } })],
      { rates: RATES, now: NOW },
    );
    assert.equal(parse(out.purchasers.csv)[0].split(',').at(-1), '19.00');
  });

  it('ignores an amount in a currency it has no rate for', () => {
    const out = buildAudiences(
      [ticket({ amountPaid: { currency: 'XYZ', amount: 500 }, amountPaidBase: null })],
      { rates: RATES, now: NOW },
    );
    assert.equal(parse(out.purchasers.csv)[0].split(',').at(-1), '0.00');
  });
});

describe('audience identity columns', () => {
  it('writes the columns Meta matches on', () => {
    const out = buildAudiences([ticket()], { rates: RATES, now: NOW });
    assert.equal(out.purchasers.csv.split('\n')[0], 'email,phone,fn,ln,gen,country,value');
    assert.equal(out.abandoners.csv.split('\n')[0], 'email,phone,fn,ln,gen,country');

    const [email, phone, fn, ln, gen, country] = parse(out.purchasers.csv)[0].split(',');
    assert.equal(email, 'buyer@example.com');
    assert.equal(phone, '971501234567');
    assert.equal(fn, 'Amir');
    assert.equal(ln, 'Khan');
    assert.equal(gen, 'm');
    assert.equal(country, 'AE');
  });

  it('takes the identity from the most recent order', () => {
    const out = buildAudiences(
      [
        ticket({ createdAt: daysAgo(100), paidAt: daysAgo(100), passengers: [{ title: 'Mr.', firstName: 'Old', lastName: 'Name' }] }),
        ticket({ createdAt: daysAgo(2), paidAt: daysAgo(2), passengers: [{ title: 'Mrs.', firstName: 'New', lastName: 'Name' }] }),
      ],
      { rates: RATES, now: NOW },
    );

    const cells = parse(out.purchasers.csv)[0].split(',');
    assert.equal(cells[2], 'New');
    assert.equal(cells[4], 'f');
  });

  it('quotes a field containing a comma so the row keeps its shape', () => {
    const out = buildAudiences(
      [ticket({ passengers: [{ title: 'Mr.', firstName: 'Amir', lastName: 'Khan, Jr' }] })],
      { rates: RATES, now: NOW },
    );
    assert.match(out.purchasers.csv, /"Khan, Jr"/);
  });

  it('defuses a name that would run as a spreadsheet formula', () => {
    const out = buildAudiences(
      [ticket({ passengers: [{ title: 'Mr.', firstName: '=HYPERLINK("http://evil.test","x")', lastName: '+1' }] })],
      { rates: RATES, now: NOW },
    );

    const row = parse(out.purchasers.csv)[0];
    assert.match(row, /"'=HYPERLINK/);
    assert.match(row, /,'\+1,/);
  });

  it('leaves a cell empty rather than guessing', () => {
    const out = buildAudiences(
      [ticket({ phoneNumber: { code: '+999', digits: '1' }, passengers: [{ title: 'Dr.', firstName: 'A', lastName: 'B' }] })],
      { rates: RATES, now: NOW },
    );
    const [, phone, , , gen, country] = parse(out.purchasers.csv)[0].split(',');
    assert.equal(phone, '');
    assert.equal(gen, '');
    assert.equal(country, '');
  });
});

describe('a partly refunded buyer', () => {
  const partlyRefunded = (overrides = {}) =>
    ticket({
      paymentStatus: 'PARTIALLY_REFUNDED',
      amountPaid: { currency: 'USD', amount: 40 },
      amountPaidBase: null,
      refundedAmount: { currency: 'USD', amount: 15 },
      ...overrides,
    });

  it('counts as a purchaser, not as someone who never bought', () => {
    const out = buildAudiences([partlyRefunded()], { rates: RATES, now: NOW });

    assert.equal(out.purchasers.rows, 1);
    assert.equal(out.abandoners.rows, 0);
  });

  it('keeps an unpaid ticket from dragging a real buyer into the never-bought file', () => {
    const out = buildAudiences(
      [partlyRefunded(), ticket({ paymentStatus: 'UNPAID', paidAt: null, amountPaid: null })],
      { rates: RATES, now: NOW },
    );

    assert.equal(out.purchasers.rows, 1);
    assert.equal(out.abandoners.rows, 0);
  });

  it('reports the value net of what was given back', () => {
    const out = buildAudiences([partlyRefunded()], { rates: RATES, now: NOW });

    assert.equal(parse(out.purchasers.csv)[0].split(',').at(-1), '25.00');
  });

  it('converts a refund booked in another currency before subtracting it', () => {
    const out = buildAudiences(
      [partlyRefunded({ refundedAmount: { currency: 'AED', amount: 36.725 } })],
      { rates: RATES, now: NOW },
    );

    assert.equal(parse(out.purchasers.csv)[0].split(',').at(-1), '30.00');
  });

  it('never reports a negative value when the refund exceeds the recorded payment', () => {
    const out = buildAudiences(
      [partlyRefunded({ refundedAmount: { currency: 'USD', amount: 90 } })],
      { rates: RATES, now: NOW },
    );

    assert.equal(parse(out.purchasers.csv)[0].split(',').at(-1), '0.00');
  });
});

describe('audience export delivery', () => {
  const build = ({ recipient = 'owner@example.com' } = {}) => {
    const sent = [];
    const service = createAudienceService({
      Ticket: { find: () => ({ lean: async () => [ticket(), ticket({ email: 'left@example.com', paymentStatus: 'UNPAID', paidAt: null })] }) },
      Currency: { find: () => ({ lean: async () => [{ code: 'AED', rate: 3.6725 }, { code: 'USD', rate: 1 }] }) },
      sendEmail: async (payload) => { sent.push(payload); },
      recipient,
      brandName: 'Dummy Ticket 365',
    });
    return { service, sent };
  };

  it('emails three attachments to the configured address', async () => {
    const { service, sent } = build();
    const result = await service.exportAudiences({ now: NOW });

    assert.equal(sent.length, 1);
    assert.equal(sent[0].email, 'owner@example.com');
    assert.equal(sent[0].attachment.length, 3);
    assert.deepEqual(
      sent[0].attachment.map((a) => a.name),
      [
        'dummy-ticket-365-purchasers.csv',
        'dummy-ticket-365-abandoned-never-bought.csv',
        'dummy-ticket-365-abandoned-last-90-days.csv',
      ],
    );
    assert.equal(result.sentTo, 'owner@example.com');
    assert.equal(result.files.length, 3);
  });

  it('attaches the csv as decodable base64', async () => {
    const { service, sent } = build();
    await service.exportAudiences({ now: NOW });

    const decoded = Buffer.from(sent[0].attachment[0].content, 'base64').toString('utf8');
    assert.match(decoded, /^email,phone,fn,ln,gen,country,value/);
    assert.match(decoded, /buyer@example\.com/);
  });

  it('refuses to run with no recipient rather than sending nowhere', async () => {
    const { service, sent } = build({ recipient: null });
    await assert.rejects(() => service.exportAudiences({ now: NOW }), /recipient/);
    assert.equal(sent.length, 0);
  });
});
