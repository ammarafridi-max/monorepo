import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import {
  ACCESS_DENIED,
  aggregateRecords,
  buildMatch,
  countRecords,
  datasetsForRole,
  findRecords,
  normaliseDatasets,
  projectRow,
} from '../src/datasets.js';
import { dummyTickets, visaLeads } from '../src/presets.js';
import { repairToolUse } from '../src/service.js';

const DOC = {
  _id: '507f1f77bcf86cd799439011',
  sessionId: 's-1',
  email: 'jane.doe@example.com',
  paymentStatus: 'PAID',
  ticketValidity: '14 Days',
  amountPaid: { amount: 120, currency: 'AED' },
  totalAmount: 120,
  createdAt: new Date('2026-10-01T00:00:00Z'),
};

function model(overrides = {}) {
  return {
    countDocuments: async () => 42,
    aggregate: async () => [{ _id: 'PAID', value: 42, count: 42 }],
    find: () => ({ select: () => ({ sort: () => ({ limit: () => ({ lean: async () => [DOC] }) }) }) }),
    db: { models: {} },
    ...overrides,
  };
}

const tickets = (role) => datasetsForRole(normaliseDatasets([dummyTickets(model())]), role)[0];

async function refuses(promise) {
  try {
    await promise;
  } catch (err) {
    return { message: err.message, status: err.statusCode };
  }
  throw new Error('expected a refusal but the call succeeded');
}

describe('role scoping', () => {
  it('gives an admin every dataset and an agent only the ones it may read', () => {
    const all = normaliseDatasets([dummyTickets(model()), visaLeads(model())]);
    assert.equal(datasetsForRole(all, 'admin').length, 2);
    assert.equal(datasetsForRole(all, 'blog-manager').length, 0);
  });

  it('withholds money fields from an agent and keeps them for an admin', () => {
    assert.deepEqual([...tickets('agent').hiddenFieldNames], ['amountPaid', 'amountPaidBase', 'totalAmount']);
    assert.equal(tickets('admin').hiddenFieldNames.size, 0);
  });

  it('marks order datasets uncountable for an agent', () => {
    assert.equal(tickets('agent').canAggregate, false);
    assert.equal(tickets('admin').canAggregate, true);
  });
});

describe('the analytics gate', () => {
  it('refuses a count to an agent with the exact sentence', async () => {
    const refusal = await refuses(countRecords(tickets('agent'), {}));
    assert.equal(refusal.message, ACCESS_DENIED);
    assert.equal(refusal.status, 403);
  });

  it('refuses a filtered count to an agent', async () => {
    const refusal = await refuses(
      countRecords(tickets('agent'), { filters: [{ field: 'ticketValidity', op: 'eq', value: '14 Days' }] }),
    );
    assert.equal(refusal.message, ACCESS_DENIED);
  });

  it('refuses an aggregate to an agent and allows it for an admin', async () => {
    assert.equal((await refuses(aggregateRecords(tickets('agent'), {}))).message, ACCESS_DENIED);
    const { result } = await aggregateRecords(tickets('admin'), { groupBy: 'paymentStatus' });
    assert.equal(result.buckets.length, 1);
  });

  it('lets an admin count', async () => {
    const { result } = await countRecords(tickets('admin'), {});
    assert.equal(result.count, 42);
  });
});

describe('the field gate', () => {
  it('refuses a filter on a withheld field', async () => {
    const refusal = await refuses(
      findRecords(tickets('agent'), { filters: [{ field: 'amountPaid', op: 'gt', value: 100 }] }, { unmask: false }),
    );
    assert.equal(refusal.message, ACCESS_DENIED);
    assert.equal(refusal.status, 403);
  });

  it('names the unknown field when it is not merely withheld', async () => {
    const refusal = await refuses(findRecords(tickets('admin'), { filters: [{ field: 'nope', op: 'eq', value: 1 }] }, { unmask: true }));
    assert.match(refusal.message, /Unknown field "nope"/);
    assert.equal(refusal.status, 400);
  });

  it('leaves withheld fields out of agent rows entirely', async () => {
    const { result } = await findRecords(tickets('agent'), {}, { unmask: false });
    const [row] = result.rows;
    assert.equal('amountPaid' in row, false);
    assert.equal('totalAmount' in row, false);
    assert.equal(row.paymentStatus, 'PAID');
  });
});

describe('masking', () => {
  it('masks sensitive values without raw access and leaves them intact with it', () => {
    const masked = projectRow(tickets('agent'), DOC, { unmask: false });
    const raw = projectRow(tickets('admin'), DOC, { unmask: true });
    assert.equal(masked.email, 'ja***@example.com');
    assert.equal(raw.email, 'jane.doe@example.com');
  });

  it('masks a phone and a name by their own shape', () => {
    const leads = datasetsForRole(normaliseDatasets([visaLeads(model())]), 'agent')[0];
    const row = projectRow(leads, { _id: 'x', phone: '+971501234567', firstName: 'Jane' }, { unmask: false });
    assert.equal(row.phone, '***567');
    assert.equal(row.firstName, 'J.');
  });
});

describe('grouping by a sensitive field', () => {
  it('refuses without raw access', async () => {
    const refusal = await refuses(aggregateRecords(tickets('admin'), { groupBy: 'email' }, { unmask: false }));
    assert.equal(refusal.message, ACCESS_DENIED);
  });

  it('allows it with raw access and reports that PII was exposed', async () => {
    const dataset = tickets('admin');
    dataset.model.aggregate = async () => [{ _id: 'jane.doe@example.com', value: 4, count: 4 }];
    const outcome = await aggregateRecords(dataset, { groupBy: 'email', minRecords: 4 }, { unmask: true });
    assert.equal(outcome.unmasked, true);
    assert.equal(outcome.result.minRecords, 4);
    assert.equal(outcome.result.buckets[0].group, 'jane.doe@example.com');
  });

  it('pushes the minRecords threshold into the pipeline', async () => {
    const dataset = tickets('admin');
    let pipeline;
    dataset.model.aggregate = async (stages) => {
      pipeline = stages;
      return [];
    };
    await aggregateRecords(dataset, { groupBy: 'email', minRecords: 4 }, { unmask: true });
    assert.deepEqual(pipeline.find((stage) => stage.$match?.count), { $match: { count: { $gte: 4 } } });
  });
});

describe('query building', () => {
  it('casts dates and numbers by the field type', () => {
    const match = buildMatch(tickets('admin'), {
      filters: [{ field: 'paymentStatus', op: 'eq', value: 'PAID' }, { field: 'totalAmount', op: 'gte', value: '100' }],
      from: '2026-10-01',
      to: '2026-11-01',
    });
    assert.equal(match.paymentStatus, 'PAID');
    assert.deepEqual(match.totalAmount, { $gte: 100 });
    assert.ok(match.createdAt.$gte instanceof Date);
    assert.ok(match.createdAt.$lt instanceof Date);
  });

  it('escapes a regex in a contains filter', () => {
    const match = buildMatch(tickets('admin'), { filters: [{ field: 'from', op: 'contains', value: 'a.*b' }] });
    assert.equal(match.from.$regex, 'a\\.\\*b');
  });

  it('refuses contains on a non-text field and an order comparison on text', () => {
    assert.throws(() => buildMatch(tickets('admin'), { filters: [{ field: 'totalAmount', op: 'contains', value: 1 }] }), /only works on text/);
    assert.throws(() => buildMatch(tickets('admin'), { filters: [{ field: 'from', op: 'gt', value: 'x' }] }), /only works on date or number/);
  });

  it('rejects an unsupported operator', () => {
    assert.throws(() => buildMatch(tickets('admin'), { filters: [{ field: 'from', op: 'regex', value: '.*' }] }), /Unsupported operator/);
  });
});

describe('detail links', () => {
  it('builds the admin path for a record and leaves it out when the reference is missing', () => {
    assert.equal(projectRow(tickets('admin'), DOC, { unmask: true }).link, '/admin/dummy-tickets/s-1');
    assert.equal('link' in projectRow(tickets('admin'), { ...DOC, sessionId: null }, { unmask: true }), false);
  });
});

describe('dataset definitions', () => {
  it('refuses a dataset that declares the same field twice', () => {
    assert.throws(
      () => normaliseDatasets([{ key: 'x', model: model(), fields: [{ name: 'a' }, { name: 'a' }] }]),
      /declares the field "a" twice/,
    );
  });

  it('refuses a dataset with no model', () => {
    assert.throws(() => normaliseDatasets([{ key: 'x' }]), /needs a key and a model/);
  });
});

describe('replaying a stored conversation', () => {
  it('puts back the input Mongoose drops from a no-argument tool call', () => {
    const stored = [
      { type: 'text', text: 'checking' },
      { type: 'tool_use', id: 'tu_1', name: 'ads_setup' },
      { type: 'tool_use', id: 'tu_2', name: 'count_records', input: { dataset: 'dummy_tickets' } },
    ];

    const repaired = repairToolUse(stored);

    assert.deepEqual(repaired[1].input, {}, 'a tool_use with no input is rejected by the Messages API');
    assert.deepEqual(repaired[2].input, { dataset: 'dummy_tickets' }, 'arguments that were stored must survive untouched');
    assert.equal(repaired[0], stored[0], 'blocks that need no repair are left alone');
  });

  it('leaves a plain text turn alone', () => {
    assert.equal(repairToolUse('a typed message'), 'a typed message');
  });

  it('keeps an empty input that did survive', () => {
    const [block] = repairToolUse([{ type: 'tool_use', id: 't', name: 'stripe_balance', input: {} }]);
    assert.deepEqual(block.input, {});
  });
});
