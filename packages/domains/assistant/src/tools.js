import { AppError } from '@travel-suite/utils';
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

export function buildToolDefinitions({ datasets, stripe }) {
  if (!datasets.length) return stripe ? buildStripeToolDefinitions() : [];

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
        'Group and total records: revenue by currency, orders by status, a daily or monthly trend. Returns one bucket per group with the metric value and the number of records behind it.',
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
          limit: { type: 'integer', description: `Buckets to return, max ${GROUP_LIMIT.max}` },
        },
        required: ['dataset'],
      },
    },
    {
      name: 'find_records',
      description:
        'List individual records, newest first by default. Use it to show examples or to locate a customer. Returns a small page only, so prefer count_records or aggregate_records for totals.',
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

  return stripe ? [...definitions, ...buildStripeToolDefinitions()] : definitions;
}

export async function executeTool({ name, input, datasets, stripe, role }) {
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
  if (name === 'aggregate_records') return { ...(await aggregateRecords(dataset, input)), dataset: dataset.key, unmasked: false };
  if (name === 'find_records') return { ...(await findRecords(dataset, input, { unmask })), dataset: dataset.key, unmasked: unmask };
  if (name === 'get_record') return { ...(await getRecord(dataset, input, { unmask })), dataset: dataset.key, unmasked: unmask };

  throw new AppError(`Unknown tool "${name}"`, 400);
}
