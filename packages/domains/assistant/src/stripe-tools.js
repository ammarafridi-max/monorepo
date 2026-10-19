import { AppError } from '@travel-suite/utils';

const SCAN_LIMIT = 2000;
const LIST_LIMIT = { default: 10, max: 25 };
const ZERO_DECIMAL = new Set([
  'bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga',
  'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf',
]);

const TRANSACTION_TYPES = [
  'charge', 'payment', 'refund', 'payment_refund', 'payout', 'adjustment',
  'stripe_fee', 'application_fee', 'transfer',
];

function toMajor(amount, currency) {
  const value = ZERO_DECIMAL.has(String(currency).toLowerCase()) ? amount : amount / 100;
  return Math.round(value * 100) / 100;
}

function toUnix(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new AppError(`"${value}" is not a date`, 400);
  return Math.floor(parsed.getTime() / 1000);
}

function isoDay(unix) {
  return new Date(unix * 1000).toISOString().slice(0, 10);
}

function bucketKey(unix, interval) {
  const date = new Date(unix * 1000);

  if (interval === 'month') return `${date.toISOString().slice(0, 7)}`;
  if (interval === 'week') {
    const day = date.getUTCDay();
    const monday = new Date(date);
    monday.setUTCDate(date.getUTCDate() - ((day + 6) % 7));
    return monday.toISOString().slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
}

function clampLimit(limit) {
  const parsed = Number(limit);
  if (!Number.isFinite(parsed) || parsed <= 0) return LIST_LIMIT.default;
  return Math.min(Math.trunc(parsed), LIST_LIMIT.max);
}

function defaultRange({ from, to }) {
  const until = toUnix(to, Math.floor(Date.now() / 1000));
  const since = toUnix(from, until - 30 * 24 * 60 * 60);
  if (since >= until) throw new AppError('The start of the range must come before the end', 400);
  return { since, until };
}

const rangeSchema = {
  from: { type: 'string', description: 'Inclusive start of the range, ISO 8601. Defaults to 30 days ago.' },
  to: { type: 'string', description: 'Exclusive end of the range, ISO 8601. Defaults to now.' },
};

export const STRIPE_TOOL_NAMES = [
  'stripe_balance',
  'stripe_revenue',
  'stripe_transactions',
  'stripe_payouts',
  'stripe_disputes',
  'stripe_find_payments',
];

export function buildStripeToolDefinitions() {
  return [
    {
      name: 'stripe_balance',
      description: 'The current Stripe balance: what is available to pay out and what is still pending, per currency.',
      input_schema: { type: 'object', properties: {} },
    },
    {
      name: 'stripe_revenue',
      description:
        'Settled Stripe revenue over a date range: gross charged, Stripe fees, net, and refunds, split by currency and optionally bucketed by day, week or month. This is the processor view of money taken, which can differ from the order records in the database.',
      input_schema: {
        type: 'object',
        properties: {
          ...rangeSchema,
          interval: { type: 'string', enum: ['none', 'day', 'week', 'month'], description: 'Defaults to none, a single total' },
          currency: { type: 'string', description: 'Restrict to one currency, such as aed or usd' },
        },
      },
    },
    {
      name: 'stripe_transactions',
      description: 'Individual Stripe balance transactions in a range, newest first. Use it to see the movements behind a total.',
      input_schema: {
        type: 'object',
        properties: {
          ...rangeSchema,
          type: { type: 'string', enum: TRANSACTION_TYPES, description: 'Restrict to one transaction type' },
          limit: { type: 'integer', description: `Rows to return, max ${LIST_LIMIT.max}` },
        },
      },
    },
    {
      name: 'stripe_payouts',
      description: 'Stripe payouts to the bank account, with status, amount and arrival date.',
      input_schema: {
        type: 'object',
        properties: {
          ...rangeSchema,
          status: { type: 'string', enum: ['paid', 'pending', 'in_transit', 'canceled', 'failed'] },
          limit: { type: 'integer', description: `Rows to return, max ${LIST_LIMIT.max}` },
        },
      },
    },
    {
      name: 'stripe_disputes',
      description: 'Chargebacks and disputes, newest first, with reason, status and the amount at risk.',
      input_schema: {
        type: 'object',
        properties: {
          ...rangeSchema,
          limit: { type: 'integer', description: `Rows to return, max ${LIST_LIMIT.max}` },
        },
      },
    },
    {
      name: 'stripe_find_payments',
      description:
        'Find Stripe charges, by customer email or by a charge, payment intent or session id, or just the most recent ones in a range.',
      input_schema: {
        type: 'object',
        properties: {
          email: { type: 'string', description: 'Customer email to search for' },
          id: { type: 'string', description: 'A charge id (ch_), payment intent id (pi_) or checkout session id (cs_)' },
          ...rangeSchema,
          limit: { type: 'integer', description: `Rows to return, max ${LIST_LIMIT.max}` },
        },
      },
    },
  ];
}

async function scan(listing, onItem) {
  let scanned = 0;

  for await (const item of listing) {
    onItem(item);
    scanned += 1;
    if (scanned >= SCAN_LIMIT) return { scanned, truncated: true };
  }

  return { scanned, truncated: false };
}

async function revenue(stripe, input) {
  const { since, until } = defaultRange(input);
  const interval = input.interval && input.interval !== 'none' ? input.interval : null;
  const currency = input.currency ? String(input.currency).toLowerCase() : null;

  const totals = new Map();

  const key = (txn) => `${txn.currency}|${interval ? bucketKey(txn.created, interval) : 'all'}`;

  const { scanned, truncated } = await scan(
    stripe.balanceTransactions.list({ created: { gte: since, lt: until }, limit: 100 }),
    (txn) => {
      if (currency && txn.currency !== currency) return;

      const id = key(txn);
      const bucket = totals.get(id) ?? {
        currency: txn.currency.toUpperCase(),
        period: interval ? bucketKey(txn.created, interval) : 'all',
        grossMinor: 0,
        feesMinor: 0,
        netMinor: 0,
        refundsMinor: 0,
        payments: 0,
        refunds: 0,
      };

      if (txn.type === 'charge' || txn.type === 'payment') {
        bucket.grossMinor += txn.amount;
        bucket.payments += 1;
      } else if (txn.type === 'refund' || txn.type === 'payment_refund') {
        bucket.refundsMinor += Math.abs(txn.amount);
        bucket.refunds += 1;
      } else if (txn.type === 'payout' || txn.type === 'transfer') {
        return;
      }

      bucket.feesMinor += txn.fee ?? 0;
      bucket.netMinor += txn.net ?? 0;

      totals.set(id, bucket);
    },
  );

  const rows = [...totals.values()]
    .map((bucket) => ({
      period: bucket.period,
      currency: bucket.currency,
      gross: toMajor(bucket.grossMinor, bucket.currency),
      fees: toMajor(bucket.feesMinor, bucket.currency),
      refunds: toMajor(bucket.refundsMinor, bucket.currency),
      net: toMajor(bucket.netMinor, bucket.currency),
      payments: bucket.payments,
      refundCount: bucket.refunds,
    }))
    .sort((a, b) => (a.period === b.period ? a.currency.localeCompare(b.currency) : a.period.localeCompare(b.period)));

  return {
    result: {
      source: 'stripe',
      from: isoDay(since),
      to: isoDay(until),
      interval: interval ?? 'none',
      transactionsScanned: scanned,
      truncated,
      rows,
    },
    rowCount: rows.length,
  };
}

async function balance(stripe) {
  const current = await stripe.balance.retrieve();

  const shape = (entries = []) =>
    entries.map((entry) => ({ currency: entry.currency.toUpperCase(), amount: toMajor(entry.amount, entry.currency) }));

  return {
    result: {
      source: 'stripe',
      available: shape(current.available),
      pending: shape(current.pending),
      instantAvailable: shape(current.instant_available),
    },
    rowCount: (current.available?.length ?? 0) + (current.pending?.length ?? 0),
  };
}

async function transactions(stripe, input) {
  const { since, until } = defaultRange(input);
  const limit = clampLimit(input.limit);

  const params = { created: { gte: since, lt: until }, limit };
  if (input.type) params.type = input.type;

  const page = await stripe.balanceTransactions.list(params);

  const rows = page.data.map((txn) => ({
    id: txn.id,
    date: new Date(txn.created * 1000).toISOString(),
    type: txn.type,
    description: txn.description ?? null,
    currency: txn.currency.toUpperCase(),
    amount: toMajor(txn.amount, txn.currency),
    fee: toMajor(txn.fee ?? 0, txn.currency),
    net: toMajor(txn.net ?? 0, txn.currency),
    status: txn.status,
  }));

  return { result: { source: 'stripe', from: isoDay(since), to: isoDay(until), returned: rows.length, rows }, rowCount: rows.length };
}

async function payouts(stripe, input) {
  const { since, until } = defaultRange(input);
  const limit = clampLimit(input.limit);

  const params = { created: { gte: since, lt: until }, limit };
  if (input.status) params.status = input.status;

  const page = await stripe.payouts.list(params);

  const rows = page.data.map((payout) => ({
    id: payout.id,
    created: new Date(payout.created * 1000).toISOString(),
    arrivalDate: payout.arrival_date ? isoDay(payout.arrival_date) : null,
    currency: payout.currency.toUpperCase(),
    amount: toMajor(payout.amount, payout.currency),
    status: payout.status,
    method: payout.method,
    failureMessage: payout.failure_message ?? null,
  }));

  return { result: { source: 'stripe', from: isoDay(since), to: isoDay(until), returned: rows.length, rows }, rowCount: rows.length };
}

async function disputes(stripe, input) {
  const { since, until } = defaultRange(input);
  const limit = clampLimit(input.limit);

  const page = await stripe.disputes.list({ created: { gte: since, lt: until }, limit });

  const rows = page.data.map((dispute) => ({
    id: dispute.id,
    created: new Date(dispute.created * 1000).toISOString(),
    currency: dispute.currency.toUpperCase(),
    amount: toMajor(dispute.amount, dispute.currency),
    status: dispute.status,
    reason: dispute.reason,
    charge: typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id ?? null,
    evidenceDueBy: dispute.evidence_details?.due_by ? isoDay(dispute.evidence_details.due_by) : null,
  }));

  return { result: { source: 'stripe', from: isoDay(since), to: isoDay(until), returned: rows.length, rows }, rowCount: rows.length };
}

function shapeCharge(charge) {
  return {
    id: charge.id,
    created: new Date(charge.created * 1000).toISOString(),
    currency: charge.currency.toUpperCase(),
    amount: toMajor(charge.amount, charge.currency),
    refunded: toMajor(charge.amount_refunded ?? 0, charge.currency),
    status: charge.status,
    paid: charge.paid,
    disputed: charge.disputed ?? false,
    email: charge.billing_details?.email ?? charge.receipt_email ?? null,
    description: charge.description ?? null,
    failureMessage: charge.failure_message ?? null,
    paymentIntent: typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id ?? null,
  };
}

async function findPayments(stripe, input) {
  const limit = clampLimit(input.limit);
  const reference = String(input.id ?? '').trim();

  if (reference) {
    if (reference.startsWith('ch_')) {
      const charge = await stripe.charges.retrieve(reference);
      return { result: { source: 'stripe', found: true, rows: [shapeCharge(charge)] }, rowCount: 1 };
    }

    if (reference.startsWith('pi_')) {
      const page = await stripe.charges.list({ payment_intent: reference, limit });
      return { result: { source: 'stripe', found: page.data.length > 0, rows: page.data.map(shapeCharge) }, rowCount: page.data.length };
    }

    if (reference.startsWith('cs_')) {
      const session = await stripe.checkout.sessions.retrieve(reference);
      const intent = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
      if (!intent) return { result: { source: 'stripe', found: false, rows: [] }, rowCount: 0 };
      const page = await stripe.charges.list({ payment_intent: intent, limit });
      return { result: { source: 'stripe', found: page.data.length > 0, rows: page.data.map(shapeCharge) }, rowCount: page.data.length };
    }

    throw new AppError('An id must start with ch_, pi_ or cs_', 400);
  }

  if (input.email) {
    const email = String(input.email).trim().replace(/"/g, '');
    const found = await stripe.charges.search({ query: `billing_details.email:"${email}"`, limit });
    return { result: { source: 'stripe', found: found.data.length > 0, rows: found.data.map(shapeCharge) }, rowCount: found.data.length };
  }

  const { since, until } = defaultRange(input);
  const page = await stripe.charges.list({ created: { gte: since, lt: until }, limit });

  return {
    result: { source: 'stripe', from: isoDay(since), to: isoDay(until), returned: page.data.length, rows: page.data.map(shapeCharge) },
    rowCount: page.data.length,
  };
}

export async function executeStripeTool({ name, input = {}, stripe }) {
  if (!stripe) throw new AppError('Stripe is not configured on this brand', 400);

  try {
    if (name === 'stripe_balance') return await balance(stripe);
    if (name === 'stripe_revenue') return await revenue(stripe, input);
    if (name === 'stripe_transactions') return await transactions(stripe, input);
    if (name === 'stripe_payouts') return await payouts(stripe, input);
    if (name === 'stripe_disputes') return await disputes(stripe, input);
    if (name === 'stripe_find_payments') return await findPayments(stripe, input);
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(`Stripe rejected the request: ${err.message}`, 502);
  }

  throw new AppError(`Unknown Stripe tool "${name}"`, 400);
}
