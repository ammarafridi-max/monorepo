import { AppError } from '@travel-suite/utils';
import {
  ADS_READ_TOOLS,
  ADS_WRITE_TOOLS,
  buildAdsToolDefinitions,
  describeAdsProposal,
  executeAdsRead,
} from './ads-tools.js';
import { STRIPE_TOOL_NAMES, buildStripeToolDefinitions, executeStripeTool } from './stripe-tools.js';
import {
  FIND_LIMIT,
  GROUP_LIMIT,
  aggregateRecords,
  canSeeRawValues,
  countRecords,
  findRecords,
  getRecord,
} from './datasets.js';

const filtersSchema = {
  type: 'array',
  description: 'Field filters, combined with AND. Only fields listed for the dataset are allowed.',
  maxItems: 10,
  items: {
    type: 'object',
    properties: {
      field: { type: 'string', description: 'Field name as listed for the dataset' },
      op: {
        type: 'string',
        enum: ['eq', 'ne', 'in', 'nin', 'gt', 'gte', 'lt', 'lte', 'contains', 'exists'],
      },
      value: { description: 'Value to compare against. An array for in/nin, a boolean for exists.' },
    },
    required: ['field', 'op'],
  },
};

const rangeSchema = {
  from: { type: 'string', description: 'Inclusive start of the date range, ISO 8601' },
  to: { type: 'string', description: 'Exclusive end of the date range, ISO 8601' },
};

function extras({ stripe, ads, adsWrite }) {
  return [
    ...(stripe ? buildStripeToolDefinitions() : []),
    ...(ads ? buildAdsToolDefinitions({ canWrite: adsWrite }) : []),
  ];
}

export function buildToolDefinitions({ datasets, stripe, ads, adsWrite }) {
  if (!datasets.length) return extras({ stripe, ads, adsWrite });

  const keys = datasets.map((d) => d.key);
  const dataset = { type: 'string', enum: keys, description: 'Which dataset to read' };

  const definitions = [
    {
      name: 'count_records',
      description: 'Count records in a dataset. Use this for "how many" questions.',
      input_schema: {
        type: 'object',
        properties: { dataset, filters: filtersSchema, ...rangeSchema },
        required: ['dataset'],
      },
    },
    {
      name: 'aggregate_records',
      description:
        'Group and total records: revenue by currency, orders by status, a daily or monthly trend, repeat customers by email, orders per handling agent. Returns one bucket per group with the metric value and the number of records behind it.',
      input_schema: {
        type: 'object',
        properties: {
          dataset,
          metric: { type: 'string', enum: ['count', 'sum', 'avg'], description: 'Defaults to count' },
          valueField: { type: 'string', description: 'Numeric field to sum or average. Required for sum and avg.' },
          groupBy: { type: 'string', description: 'Field to group by. Leave empty for a single total.' },
          interval: {
            type: 'string',
            enum: ['day', 'week', 'month'],
            description: 'Bucket by the dataset date field instead of groupBy, for trends over time',
          },
          filters: filtersSchema,
          ...rangeSchema,
          minRecords: {
            type: 'integer',
            description:
              'Only return groups backed by at least this many records. Use it for repeat-customer questions: group by email with minRecords 4 for "paid more than 3 times".',
          },
          limit: { type: 'integer', description: `Buckets to return, max ${GROUP_LIMIT.max}` },
        },
        required: ['dataset'],
      },
    },
    {
      name: 'find_records',
      description:
        'List individual records, newest first by default. Use it to show examples or to locate a customer, including every order for one email address. Each row carries a "link" to its admin page when one exists. Returns a small page only, so prefer count_records or aggregate_records for totals.',
      input_schema: {
        type: 'object',
        properties: {
          dataset,
          search: { type: 'string', description: 'Free text match across the searchable fields of the dataset' },
          filters: filtersSchema,
          ...rangeSchema,
          sortBy: { type: 'string', description: 'Field to sort by' },
          sortDir: { type: 'string', enum: ['asc', 'desc'] },
          limit: { type: 'integer', description: `Rows to return, max ${FIND_LIMIT.max}` },
        },
        required: ['dataset'],
      },
    },
    {
      name: 'get_record',
      description: 'Fetch one record by its id or its reference, such as a session id, booking reference or policy number.',
      input_schema: {
        type: 'object',
        properties: { dataset, id: { type: 'string' } },
        required: ['dataset', 'id'],
      },
    },
  ];

  return [...definitions, ...extras({ stripe, ads, adsWrite })];
}

export async function executeTool({ name, input, datasets, stripe, ads, propose, role }) {
  if (ADS_READ_TOOLS.includes(name)) {
    if (!ads) throw new AppError('OpenAI Ads is not configured on this brand', 400);
    const { result, rowCount } = await executeAdsRead({ name, input, ads });
    return { result, rowCount, dataset: 'openai-ads', unmasked: false };
  }

  if (ADS_WRITE_TOOLS.includes(name)) {
    if (!ads) throw new AppError('OpenAI Ads is not configured on this brand', 400);
    if (!propose) throw new AppError('You are not allowed to change the ad account', 403);

    const { summary, details } = await describeAdsProposal({ name, input, ads });
    const action = await propose({ kind: name, params: input, summary, details });

    return {
      result: {
        proposed: true,
        actionId: action.id,
        summary,
        details,
        awaiting: 'Nothing has changed yet. The admin has to approve this in the chat window before it runs.',
      },
      rowCount: 0,
      dataset: 'openai-ads',
      unmasked: false,
      proposal: { ...action, summary, details },
    };
  }

  if (STRIPE_TOOL_NAMES.includes(name)) {
    const { result, rowCount } = await executeStripeTool({ name, input, stripe });
    return { result, rowCount, dataset: 'stripe', unmasked: true };
  }

  const key = input?.dataset;
  const dataset = datasets.find((d) => d.key === key);

  if (!dataset) {
    throw new AppError(
      `Unknown dataset "${key}". Available: ${datasets.map((d) => d.key).join(', ') || 'none'}`,
      400,
    );
  }

  const unmask = canSeeRawValues(dataset, role);

  if (name === 'count_records') return { ...(await countRecords(dataset, input)), dataset: dataset.key, unmasked: false };
  if (name === 'aggregate_records') {
    const outcome = await aggregateRecords(dataset, input, { unmask });
    return { ...outcome, dataset: dataset.key, unmasked: Boolean(outcome.unmasked) };
  }
  if (name === 'find_records') return { ...(await findRecords(dataset, input, { unmask })), dataset: dataset.key, unmasked: unmask };
  if (name === 'get_record') return { ...(await getRecord(dataset, input, { unmask })), dataset: dataset.key, unmasked: unmask };

  throw new AppError(`Unknown tool "${name}"`, 400);
}
