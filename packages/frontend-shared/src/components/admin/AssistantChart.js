'use client';

import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const SERIES = '#2a78d6';
const GRID = '#e5e7eb';
const AXIS_INK = '#6b7280';

const MONTHS =
  /^(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)$/i;

const TIME_LABEL = [
  /^\d{4}-\d{2}-\d{2}$/,
  /^\d{4}-\d{2}$/,
  /^\d{4}$/,
  /^\d{1,2}\s+[A-Za-z]{3,9}/,
  /^[A-Za-z]{3,9}\s+\d{1,4}$/,
  /^[A-Za-z]{3,9}$/,
];

export function parseNumber(cell) {
  if (cell === null || cell === undefined) return null;

  const text = String(cell).trim();
  if (!text || text === '-' || text === '—') return null;

  const negative = /^\(.*\)$/.test(text);
  const digits = text.replace(/[()]/g, '').replace(/[^0-9.-]/g, '');
  if (!/\d/.test(digits)) return null;

  const value = Number(digits);
  if (!Number.isFinite(value)) return null;

  return negative ? -value : value;
}

function isTimeLike(values) {
  const sample = values.filter(Boolean).slice(0, 6);
  if (!sample.length) return false;

  return sample.every((value) => {
    const word = value.match(/[A-Za-z]+/);
    if (word && !MONTHS.test(word[0])) return false;
    return TIME_LABEL.some((pattern) => pattern.test(value));
  });
}

export function describeChart(headings, rows) {
  if (rows.length < 2) return null;

  const numeric = [];
  for (let column = 0; column < headings.length; column += 1) {
    const parsed = rows.map((row) => parseNumber(row[column]));
    const filled = parsed.filter((value) => value !== null);
    if (filled.length >= Math.max(2, Math.ceil(rows.length * 0.6))) {
      numeric.push({ column, heading: headings[column] || `Column ${column + 1}` });
    }
  }

  if (!numeric.length) return null;

  let labelColumn = headings.findIndex((_, column) => !numeric.some((m) => m.column === column));

  if (labelColumn === -1) {
    if (numeric.length < 2) return null;
    labelColumn = numeric[0].column;
    numeric.shift();
  }

  const labels = rows.map((row) => String(row[labelColumn] ?? '').trim());

  return {
    labelColumn,
    labelHeading: headings[labelColumn] || '',
    measures: numeric,
    kind: isTimeLike(labels) ? 'line' : 'bar',
    horizontal: labels.some((label) => label.length > 14) || rows.length > 8,
  };
}

function compact(value) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${Math.round(value / 100_000) / 10}m`;
  if (abs >= 1000) return `${Math.round(value / 100) / 10}k`;
  return String(Math.round(value * 100) / 100);
}

function full(value) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function ChartTooltip({ active, payload, label, measure }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 shadow-lg">
      <p className="text-[11px] font-medium text-gray-500">{label}</p>
      <p className="text-[13px] font-semibold tabular-nums text-gray-900">
        {full(payload[0].value)}
        <span className="ml-1 text-[11px] font-normal text-gray-400">{measure}</span>
      </p>
    </div>
  );
}

export default function AssistantChart({ headings, rows, spec }) {
  const [measureColumn, setMeasureColumn] = useState(spec.measures[0].column);

  const measure = spec.measures.find((m) => m.column === measureColumn) ?? spec.measures[0];

  const data = useMemo(
    () =>
      rows
        .map((row) => ({
          label: String(row[spec.labelColumn] ?? '').trim(),
          value: parseNumber(row[measure.column]),
        }))
        .filter((point) => point.value !== null),
    [rows, spec.labelColumn, measure.column],
  );

  if (!data.length) return null;

  const axisTick = { fontSize: 11, fill: AXIS_INK };
  const labelled = data.length <= 8;

  return (
    <div>
      {spec.measures.length > 1 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {spec.measures.map((option) => (
            <button
              key={option.column}
              type="button"
              onClick={() => setMeasureColumn(option.column)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                option.column === measure.column
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {option.heading}
            </button>
          ))}
        </div>
      )}

      <div style={{ height: spec.horizontal ? Math.min(40 + data.length * 28, 320) : 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          {spec.kind === 'line' ? (
            <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={{ stroke: GRID }} />
              <YAxis tick={axisTick} tickLine={false} axisLine={false} tickFormatter={compact} width={48} />
              <Tooltip content={<ChartTooltip measure={measure.heading} />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={SERIES}
                strokeWidth={2}
                dot={{ r: 3, fill: SERIES, stroke: '#ffffff', strokeWidth: 2 }}
                activeDot={{ r: 5, fill: SERIES, stroke: '#ffffff', strokeWidth: 2 }}
              />
            </LineChart>
          ) : spec.horizontal ? (
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 36, bottom: 4, left: 4 }} barCategoryGap={2}>
              <CartesianGrid stroke={GRID} horizontal={false} />
              <XAxis type="number" tick={axisTick} tickLine={false} axisLine={false} tickFormatter={compact} />
              <YAxis
                type="category"
                dataKey="label"
                tick={axisTick}
                tickLine={false}
                axisLine={{ stroke: GRID }}
                width={Math.min(150, Math.max(70, ...data.map((d) => d.label.length * 6.5)))}
              />
              <Tooltip content={<ChartTooltip measure={measure.heading} />} cursor={{ fill: '#f9fafb' }} />
              <Bar dataKey="value" fill={SERIES} radius={[0, 4, 4, 0]} maxBarSize={18}>
                {labelled && (
                  <LabelList dataKey="value" position="right" formatter={compact} style={{ fontSize: 11, fill: AXIS_INK }} />
                )}
              </Bar>
            </BarChart>
          ) : (
            <BarChart data={data} margin={{ top: 18, right: 12, bottom: 4, left: 4 }} barCategoryGap={2}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={{ stroke: GRID }} />
              <YAxis tick={axisTick} tickLine={false} axisLine={false} tickFormatter={compact} width={48} />
              <Tooltip content={<ChartTooltip measure={measure.heading} />} cursor={{ fill: '#f9fafb' }} />
              <Bar dataKey="value" fill={SERIES} radius={[4, 4, 0, 0]} maxBarSize={44}>
                {labelled && (
                  <LabelList dataKey="value" position="top" formatter={compact} style={{ fontSize: 11, fill: AXIS_INK }} />
                )}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      <p className="mt-1 text-[11px] text-gray-400">
        {measure.heading}
        {spec.labelHeading ? ` by ${spec.labelHeading.toLowerCase()}` : ''}
      </p>
    </div>
  );
}
