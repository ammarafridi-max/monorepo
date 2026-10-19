import { AppError } from '@travel-suite/utils';

export const ACCESS_DENIED = 'You are not allowed to access this data.';

export const FIND_LIMIT = { default: 10, max: 25 };
export const GROUP_LIMIT = { default: 20, max: 50 };

const FILTER_OPS = ['eq', 'ne', 'in', 'nin', 'gt', 'gte', 'lt', 'lte', 'contains', 'exists'];
const GROUPABLE_TYPES = ['string', 'enum', 'boolean'];
const ORDER_OPS = ['gt', 'gte', 'lt', 'lte'];

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normaliseField(field) {
  const type = field.type ?? 'string';
  return {
    name: field.name,
    path: field.path ?? field.name,
    type,
    roles: field.roles ?? null,
    resolve: field.resolve ?? null,
    description: field.description ?? null,
    values: field.values ?? null,
    filterable: field.filterable ?? true,
    groupable: field.groupable ?? GROUPABLE_TYPES.includes(type),
    summable: field.summable ?? false,
    searchable: field.searchable ?? false,
    sortable: field.sortable ?? ['date', 'number'].includes(type),
    sensitive: field.sensitive ?? false,
    mask: field.mask ?? 'text',
  };
}

export function normaliseDatasets(datasets = []) {
  return datasets.filter(Boolean).map((dataset) => {
    if (!dataset.key || !dataset.model) {
      throw new Error('[assistant] every dataset needs a key and a model');
    }

    const fields = (dataset.fields ?? []).map(normaliseField);
    const dateField = dataset.dateField ?? 'createdAt';

    if (!fields.some((f) => f.name === dateField)) {
      fields.unshift(normaliseField({ name: dateField, type: 'date' }));
    }

    const duplicate = fields.map((f) => f.name).find((name, index, all) => all.indexOf(name) !== index);
    if (duplicate) {
      throw new Error(`[assistant] dataset "${dataset.key}" declares the field "${duplicate}" twice`);
    }

    return {
      key: dataset.key,
      label: dataset.label ?? dataset.key,
      description: dataset.description ?? '',
      model: dataset.model,
      roles: dataset.roles ?? ['admin'],
      analyticsRoles: dataset.analyticsRoles ?? dataset.roles ?? ['admin'],
      rawAccessRoles: dataset.rawAccessRoles ?? ['admin'],
      dateField,
      detailPath: dataset.detailPath ?? null,
      idFields: dataset.idFields ?? [],
      defaultSort: dataset.defaultSort ?? dateField,
      fields,
      fieldByName: new Map(fields.map((f) => [f.name, f])),
    };
  });
}

export function scopeDatasetForRole(dataset, role) {
  const visible = dataset.fields.filter((field) => !field.roles || field.roles.includes(role));
  const hidden = dataset.fields.filter((field) => field.roles && !field.roles.includes(role));

  const defaultSort = visible.some((field) => field.name === dataset.defaultSort)
    ? dataset.defaultSort
    : dataset.dateField;

  return {
    ...dataset,
    fields: visible,
    fieldByName: new Map(visible.map((field) => [field.name, field])),
    hiddenFieldNames: new Set(hidden.map((field) => field.name)),
    canAggregate: dataset.analyticsRoles.includes(role),
    defaultSort,
  };
}

export function datasetsForRole(datasets, role) {
  return datasets.filter((dataset) => dataset.roles.includes(role)).map((dataset) => scopeDatasetForRole(dataset, role));
}

export function canSeeRawValues(dataset, role) {
  return dataset.rawAccessRoles.includes(role);
}

function fieldOrThrow(dataset, name) {
  const field = dataset.fieldByName.get(name);
  if (!field && dataset.hiddenFieldNames?.has(name)) {
    throw new AppError(ACCESS_DENIED, 403);
  }
  if (!field) {
    throw new AppError(
      `Unknown field "${name}" on dataset "${dataset.key}". Available: ${[...dataset.fieldByName.keys()].join(', ')}`,
      400,
    );
  }
  return field;
}

function castScalar(field, value) {
  if (value === null || value === undefined) return value;

  if (field.type === 'date') {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) throw new AppError(`"${value}" is not a date`, 400);
    return parsed;
  }

  if (field.type === 'number') {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) throw new AppError(`"${value}" is not a number`, 400);
    return parsed;
  }

  if (field.type === 'boolean') {
    if (typeof value === 'boolean') return value;
    return String(value).toLowerCase() === 'true';
  }

  return String(value);
}

function buildCondition(field, op, value) {
  if (!FILTER_OPS.includes(op)) {
    throw new AppError(`Unsupported operator "${op}". Use one of: ${FILTER_OPS.join(', ')}`, 400);
  }

  if (op === 'exists') return { $exists: Boolean(value) };

  if (op === 'contains') {
    if (field.type !== 'string' && field.type !== 'enum') {
      throw new AppError(`"contains" only works on text fields, and "${field.name}" is ${field.type}`, 400);
    }
    return { $regex: escapeRegex(value), $options: 'i' };
  }

  if (op === 'in' || op === 'nin') {
    const list = (Array.isArray(value) ? value : [value]).slice(0, 25).map((v) => castScalar(field, v));
    return op === 'in' ? { $in: list } : { $nin: list };
  }

  if (ORDER_OPS.includes(op) && !['date', 'number'].includes(field.type)) {
    throw new AppError(`"${op}" only works on date or number fields, and "${field.name}" is ${field.type}`, 400);
  }

  const cast = castScalar(field, value);
  if (op === 'eq') return cast;
  return { [`$${op}`]: cast };
}

function mergeCondition(query, path, condition) {
  const existing = query[path];
  if (existing === undefined) {
    query[path] = condition;
    return;
  }

  const asObject = (value) => (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date) ? value : { $eq: value });
  query[path] = { ...asObject(existing), ...asObject(condition) };
}

export function buildMatch(dataset, { filters = [], from, to, search } = {}) {
  const query = {};

  for (const filter of filters.slice(0, 10)) {
    const field = fieldOrThrow(dataset, filter?.field);
    if (!field.filterable) throw new AppError(`Field "${field.name}" is not filterable`, 400);
    mergeCondition(query, field.path, buildCondition(field, filter?.op ?? 'eq', filter?.value));
  }

  if (from || to) {
    const field = fieldOrThrow(dataset, dataset.dateField);
    if (field.type !== 'date') {
      throw new AppError(`Dataset "${dataset.key}" has no usable date field for a date range`, 400);
    }
    const range = {};
    if (from) range.$gte = castScalar(field, from);
    if (to) range.$lt = castScalar(field, to);
    mergeCondition(query, field.path, range);
  }

  if (search) {
    const searchable = dataset.fields.filter((f) => f.searchable);
    if (!searchable.length) {
      throw new AppError(`Dataset "${dataset.key}" has no searchable fields`, 400);
    }
    query.$or = searchable.map((field) => ({
      [field.path]: { $regex: escapeRegex(search), $options: 'i' },
    }));
  }

  return query;
}

function maskText(value, mask) {
  const text = String(value);

  if (mask === 'email') {
    const [local, domain] = text.split('@');
    if (!domain) return `${text.slice(0, 2)}***`;
    return `${local.slice(0, 2)}***@${domain}`;
  }

  if (mask === 'phone') return `***${text.slice(-3)}`;
  if (mask === 'name') return `${text.slice(0, 1)}.`;

  return `${text.slice(0, 2)}***`;
}

function readPath(doc, path) {
  return path.split('.').reduce((node, key) => (node === null || node === undefined ? node : node[key]), doc);
}

function serialise(value) {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.length;
  if (typeof value === 'object') return String(value);
  return value;
}

function fillDetailPath(dataset, doc) {
  if (!dataset.detailPath) return null;

  let missing = false;
  const path = dataset.detailPath.replace(/\{([\w.]+)\}/g, (_, token) => {
    if (token === '_id' || token === 'id') return String(doc._id);
    const field = dataset.fieldByName.get(token);
    const value = readPath(doc, field?.path ?? token);
    if (value === null || value === undefined || value === '') missing = true;
    return String(value);
  });

  return missing ? null : path;
}

export function projectRow(dataset, doc, { unmask }) {
  const row = { id: String(doc._id) };
  const link = fillDetailPath(dataset, doc);
  if (link) row.link = link;

  for (const field of dataset.fields) {
    const raw = serialise(readPath(doc, field.path));
    if (raw === null) {
      row[field.name] = null;
      continue;
    }
    row[field.name] = field.sensitive && !unmask ? maskText(raw, field.mask) : raw;
  }

  return row;
}

function selectPaths(dataset) {
  return [...new Set(dataset.fields.map((f) => f.path))].join(' ');
}

function resolvableFields(dataset) {
  return dataset.fields.filter((field) => field.resolve);
}

async function resolveReferences(dataset, rows) {
  for (const field of resolvableFields(dataset)) {
    const ids = [...new Set(rows.map((row) => row[field.name]).filter(Boolean))];
    const names = await lookupNames(dataset, field, ids);
    for (const row of rows) {
      if (row[field.name]) row[field.name] = names.get(String(row[field.name])) ?? 'unassigned';
    }
  }
  return rows;
}

async function lookupNames(dataset, field, ids) {
  const valid = ids.filter((id) => /^[0-9a-f]{24}$/i.test(String(id)));
  if (!valid.length) return new Map();

  const Ref = dataset.model.db?.models?.[field.resolve.model];
  if (!Ref) return new Map();

  const docs = await Ref.find({ _id: { $in: valid } }).select(field.resolve.field).lean();
  return new Map(docs.map((doc) => [String(doc._id), doc[field.resolve.field]]));
}

function clampLimit(limit, bounds) {
  const parsed = Number(limit);
  if (!Number.isFinite(parsed) || parsed <= 0) return bounds.default;
  return Math.min(Math.trunc(parsed), bounds.max);
}

function assertCanAggregate(dataset) {
  if (dataset.canAggregate === false) throw new AppError(ACCESS_DENIED, 403);
}

export async function countRecords(dataset, args) {
  assertCanAggregate(dataset);
  const match = buildMatch(dataset, args);
  const count = await dataset.model.countDocuments(match);
  return { result: { dataset: dataset.key, count }, rowCount: 1 };
}

export async function findRecords(dataset, args, { unmask }) {
  const match = buildMatch(dataset, args);
  const limit = clampLimit(args.limit, FIND_LIMIT);

  const sortField = args.sortBy ? fieldOrThrow(dataset, args.sortBy) : dataset.fieldByName.get(dataset.defaultSort);
  if (args.sortBy && !sortField.sortable) throw new AppError(`Field "${sortField.name}" is not sortable`, 400);

  const docs = await dataset.model
    .find(match)
    .select(selectPaths(dataset))
    .sort({ [sortField?.path ?? 'createdAt']: args.sortDir === 'asc' ? 1 : -1 })
    .limit(limit)
    .lean();

  const rows = await resolveReferences(dataset, docs.map((doc) => projectRow(dataset, doc, { unmask })));
  return { result: { dataset: dataset.key, returned: rows.length, limit, rows }, rowCount: rows.length };
}

export async function getRecord(dataset, args, { unmask }) {
  const reference = String(args.id ?? '').trim();
  if (!reference) throw new AppError('id is required', 400);

  const or = [];
  if (/^[0-9a-f]{24}$/i.test(reference)) or.push({ _id: reference });
  for (const name of dataset.idFields) {
    const field = fieldOrThrow(dataset, name);
    or.push({ [field.path]: reference });
  }
  if (!or.length) throw new AppError(`"${reference}" is not a valid record reference`, 400);

  const doc = await dataset.model.findOne({ $or: or }).select(selectPaths(dataset)).lean();
  if (!doc) return { result: { dataset: dataset.key, found: false }, rowCount: 0 };

  const [record] = await resolveReferences(dataset, [projectRow(dataset, doc, { unmask })]);
  return { result: { dataset: dataset.key, found: true, record }, rowCount: 1 };
}

export async function aggregateRecords(dataset, args, { unmask } = { unmask: false }) {
  assertCanAggregate(dataset);

  const metric = args.metric ?? 'count';
  if (!['count', 'sum', 'avg'].includes(metric)) {
    throw new AppError(`Unsupported metric "${metric}". Use count, sum or avg`, 400);
  }

  const match = buildMatch(dataset, args);
  const limit = clampLimit(args.limit, GROUP_LIMIT);
  const pipeline = [{ $match: match }];

  let valueField = null;
  if (metric !== 'count') {
    valueField = fieldOrThrow(dataset, args.valueField);
    if (!valueField.summable) throw new AppError(`Field "${valueField.name}" cannot be summed or averaged`, 400);
  }

  let groupId = null;
  let groupField = null;
  let timeSeries = false;

  if (args.interval) {
    if (!['day', 'week', 'month'].includes(args.interval)) {
      throw new AppError('interval must be day, week or month', 400);
    }
    const dateField = fieldOrThrow(dataset, dataset.dateField);
    if (dateField.type !== 'date') throw new AppError(`Dataset "${dataset.key}" cannot be bucketed by time`, 400);
    groupId = { $dateTrunc: { date: `$${dateField.path}`, unit: args.interval } };
    timeSeries = true;
  } else if (args.groupBy) {
    groupField = fieldOrThrow(dataset, args.groupBy);
    if (!groupField.groupable) throw new AppError(`Field "${groupField.name}" is not groupable`, 400);
    if (groupField.sensitive && !unmask) throw new AppError(ACCESS_DENIED, 403);
    groupId = `$${groupField.path}`;
  }

  const accumulator = metric === 'count' ? { $sum: 1 } : { [`$${metric}`]: `$${valueField.path}` };

  pipeline.push({ $group: { _id: groupId, value: accumulator, count: { $sum: 1 } } });

  const minRecords = Number(args.minRecords);
  if (Number.isFinite(minRecords) && minRecords > 1) {
    pipeline.push({ $match: { count: { $gte: Math.trunc(minRecords) } } });
  }

  pipeline.push({ $sort: timeSeries ? { _id: 1 } : { value: -1 } });
  pipeline.push({ $limit: limit });

  const rows = await dataset.model.aggregate(pipeline);

  const names = groupField?.resolve
    ? await lookupNames(dataset, groupField, rows.map((row) => row._id))
    : new Map();

  const buckets = rows.map((row) => {
    const raw = row._id instanceof Date ? row._id.toISOString().slice(0, 10) : (row._id ?? 'none');
    return {
      group: groupField?.resolve ? (names.get(String(row._id)) ?? 'unassigned') : raw,
      value: typeof row.value === 'number' ? Math.round(row.value * 100) / 100 : row.value,
      records: row.count,
    };
  });

  return {
    result: {
      dataset: dataset.key,
      metric,
      valueField: valueField?.name ?? null,
      groupedBy: args.interval ? `${dataset.dateField} by ${args.interval}` : (args.groupBy ?? 'all records'),
      minRecords: Number.isFinite(minRecords) && minRecords > 1 ? Math.trunc(minRecords) : null,
      buckets,
    },
    rowCount: buckets.length,
    unmasked: Boolean(groupField?.sensitive),
  };
}
