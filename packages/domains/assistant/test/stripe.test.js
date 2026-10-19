import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import { executeStripeTool } from '../src/stripe-tools.js';

const day = (d) => Math.floor(new Date(d).getTime() / 1000);

const TXNS = [
  { id: 't1', created: day('2026-10-02'), type: 'charge', amount: 10000, fee: 320, net: 9680, currency: 'aed' },
  { id: 't2', created: day('2026-10-02'), type: 'charge', amount: 5000, fee: 175, net: 4825, currency: 'aed' },
  { id: 't3', created: day('2026-10-03'), type: 'refund', amount: -5000, fee: 0, net: -5000, currency: 'aed' },
  { id: 't4', created: day('2026-10-03'), type: 'charge', amount: 2000, fee: 88, net: 1912, currency: 'usd' },
  { id: 't5', created: day('2026-10-04'), type: 'payout', amount: -9000, fee: 0, net: -9000, currency: 'aed' },
  { id: 't6', created: day('2026-10-04'), type: 'stripe_fee', amount: -100, fee: 0, net: -100, currency: 'aed' },
];

const stripe = {
  balance: {
    retrieve: async () => ({ available: [{ amount: 123456, currency: 'aed' }], pending: [{ amount: 100, currency: 'jpy' }] }),
  },
  balanceTransactions: {
    list: (params) => {
      const match = TXNS.filter((t) => t.created >= params.created.gte && t.created < params.created.lt);
      return { data: match, [Symbol.asyncIterator]: async function* () { for (const t of match) yield t; } };
    },
  },
};

const range = { from: '2026-10-01', to: '2026-10-05' };

describe('stripe revenue', () => {
  it('totals gross, fees, refunds and net per currency', async () => {
    const { result } = await executeStripeTool({ name: 'stripe_revenue', input: range, stripe });
    const aed = result.rows.find((row) => row.currency === 'AED');
    const usd = result.rows.find((row) => row.currency === 'USD');

    assert.deepEqual(
      { gross: aed.gross, fees: aed.fees, refunds: aed.refunds, net: aed.net, payments: aed.payments },
      { gross: 150, fees: 4.95, refunds: 50, net: 94.05, payments: 2 },
    );
    assert.equal(usd.gross, 20);
  });

  it('leaves payouts out of revenue', async () => {
    const { result } = await executeStripeTool({ name: 'stripe_revenue', input: range, stripe });
    const total = result.rows.reduce((sum, row) => sum + row.gross, 0);
    assert.equal(total, 170);
  });

  it('buckets by day when asked', async () => {
    const { result } = await executeStripeTool({ name: 'stripe_revenue', input: { ...range, interval: 'day' }, stripe });
    assert.equal(result.interval, 'day');
    assert.equal(result.rows[0].period, '2026-10-02');
    assert.ok(result.rows.length > 1);
  });

  it('restricts to one currency', async () => {
    const { result } = await executeStripeTool({ name: 'stripe_revenue', input: { ...range, currency: 'usd' }, stripe });
    assert.equal(result.rows.length, 1);
    assert.equal(result.rows[0].currency, 'USD');
  });
});

describe('stripe balance', () => {
  it('converts minor units, leaving zero-decimal currencies alone', async () => {
    const { result } = await executeStripeTool({ name: 'stripe_balance', input: {}, stripe });
    assert.equal(result.available[0].amount, 1234.56);
    assert.equal(result.pending[0].amount, 100);
  });
});

describe('stripe guards', () => {
  it('refuses when Stripe is not configured', async () => {
    await assert.rejects(executeStripeTool({ name: 'stripe_balance', input: {}, stripe: null }), /not configured/);
  });

  it('refuses an id that is not a Stripe reference', async () => {
    await assert.rejects(
      executeStripeTool({ name: 'stripe_find_payments', input: { id: 'order-123' }, stripe }),
      /must start with ch_, pi_ or cs_/,
    );
  });

  it('refuses an unknown tool and a backwards date range', async () => {
    await assert.rejects(executeStripeTool({ name: 'stripe_nope', input: {}, stripe }), /Unknown Stripe tool/);
    await assert.rejects(
      executeStripeTool({ name: 'stripe_revenue', input: { from: '2026-10-05', to: '2026-10-01' }, stripe }),
      /must come before/,
    );
  });
});
