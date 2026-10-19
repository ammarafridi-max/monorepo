'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BarChart3, Download, Table2 } from 'lucide-react';
import AssistantChart, { describeChart } from './AssistantChart.js';

const MD_LINK = /\[([^\]]+)\]\((\/[\w\-/.]*)\)/g;
const BOLD = /\*\*(.+?)\*\*/g;
const ADMIN_PATH = /(\/admin[\w\-/]*)/g;
const SEPARATOR = /^\|?[\s:|-]*-[\s:|-]*\|?$/;

function Linked({ text, keyPrefix }) {
  const pieces = String(text ?? '').split(MD_LINK);
  const nodes = [];

  for (let i = 0; i < pieces.length; i += 1) {
    if (i % 3 === 0) {
      nodes.push(<Plain key={`${keyPrefix}-t${i}`} text={pieces[i]} keyPrefix={`${keyPrefix}-t${i}`} />);
      continue;
    }
    if (i % 3 === 1) {
      nodes.push(
        <Link
          key={`${keyPrefix}-l${i}`}
          href={pieces[i + 1]}
          className="font-medium text-primary-700 underline decoration-primary-700/30 hover:decoration-primary-700"
        >
          {pieces[i]}
        </Link>,
      );
    }
  }

  return nodes;
}

function Plain({ text, keyPrefix }) {
  const parts = String(text ?? '').split(BOLD);

  return parts.map((part, index) => {
    const bold = index % 2 === 1;
    const segments = part.split(ADMIN_PATH);

    const nodes = segments.map((segment, segmentIndex) =>
      segmentIndex % 2 === 1 ? (
        <Link
          key={`${keyPrefix}-${index}-${segmentIndex}`}
          href={segment}
          className="text-primary-700 font-medium underline decoration-primary-700/30 hover:decoration-primary-700"
        >
          {segment}
        </Link>
      ) : (
        segment
      ),
    );

    return bold ? (
      <strong key={`${keyPrefix}-b${index}`} className="font-semibold text-gray-900">
        {nodes}
      </strong>
    ) : (
      <span key={`${keyPrefix}-s${index}`}>{nodes}</span>
    );
  });
}

function Inline({ text }) {
  return <Linked text={text} keyPrefix="i" />;
}

function splitRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function isTableRow(line) {
  return line.trim().includes('|');
}

function alignmentsFrom(separator) {
  return splitRow(separator).map((cell) => {
    const left = cell.startsWith(':');
    const right = cell.endsWith(':');
    if (left && right) return 'text-center';
    if (right) return 'text-right';
    return 'text-left';
  });
}

function numericColumns(rows, columnCount) {
  const numeric = [];

  for (let column = 0; column < columnCount; column += 1) {
    const values = rows.map((row) => row[column]).filter((cell) => cell && cell !== '-');
    numeric[column] =
      values.length > 0 && values.every((cell) => /^[^a-zA-Z]*\d[\d.,%\s()+-]*$/.test(cell));
  }

  return numeric;
}

function Grid({ headings, body, alignFor, numeric }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr className="bg-gray-50">
            {headings.map((heading, column) => (
              <th
                key={column}
                className={`whitespace-nowrap border-b border-gray-200 px-3 py-2 font-semibold text-gray-600 ${alignFor(column)}`}
              >
                <Inline text={heading} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, index) => (
            <tr key={index} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60">
              {headings.map((_, column) => (
                <td
                  key={column}
                  className={`px-3 py-1.5 text-gray-700 ${alignFor(column)} ${numeric[column] ? 'tabular-nums' : ''}`}
                >
                  <Inline text={row[column] ?? ''} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Table({ header, separator, rows }) {
  const headings = splitRow(header);
  const aligned = alignmentsFrom(separator);
  const body = rows.map(splitRow);
  const numeric = numericColumns(body, headings.length);

  const alignFor = (column) => {
    if (aligned[column] && aligned[column] !== 'text-left') return aligned[column];
    return numeric[column] ? 'text-right' : 'text-left';
  };

  const spec = describeChart(headings, body);
  const [view, setView] = useState('table');

  function downloadCsv() {
    const escape = (cell) => {
      const text = String(cell ?? '').replace(MD_LINK, '$1');
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };

    const csv = [headings, ...body].map((row) => row.map(escape).join(',')).join('\n');
    const url = globalThis.URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = `assistant-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    globalThis.URL.revokeObjectURL(url);
  }

  const exportButton = (
    <button
      type="button"
      onClick={downloadCsv}
      title="Download as CSV"
      className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
    >
      <Download size={12} />
      CSV
    </button>
  );

  const grid = <Grid headings={headings} body={body} alignFor={alignFor} numeric={numeric} />;

  if (!spec) {
    return (
      <div>
        <div className="mb-1 flex justify-end">{exportButton}</div>
        {grid}
      </div>
    );
  }

  const tab = (key, label, Icon) => (
    <button
      key={key}
      type="button"
      onClick={() => setView(key)}
      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
        view === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      <Icon size={12} />
      {label}
    </button>
  );

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="inline-flex gap-0.5 rounded-xl bg-gray-100 p-0.5">
          {tab('table', 'Table', Table2)}
          {tab('graph', 'Graph', BarChart3)}
        </div>
        {exportButton}
      </div>

      {view === 'table' ? grid : <AssistantChart headings={headings} rows={body} spec={spec} />}
    </div>
  );
}

const FOLLOW_UPS = /^\s*FOLLOW-?UPS\s*:\s*(.*)$/im;

export function splitFollowUps(text) {
  const source = String(text ?? '');
  const match = source.match(FOLLOW_UPS);

  if (!match) return { body: source, followUps: [] };

  const followUps = match[1]
    .split('|')
    .map((question) => question.trim())
    .filter((question) => question.length > 2 && question.length < 120)
    .slice(0, 3);

  return { body: source.replace(FOLLOW_UPS, '').trimEnd(), followUps };
}

export default function AssistantText({ text }) {
  const lines = splitFollowUps(text).body.split('\n');
  const blocks = [];
  let bullets = [];

  const flush = () => {
    if (!bullets.length) return;
    blocks.push(
      <ul key={`list-${blocks.length}`} className="list-disc space-y-1 pl-5">
        {bullets.map((item, index) => (
          <li key={index}>
            <Inline text={item} />
          </li>
        ))}
      </ul>,
    );
    bullets = [];
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();

    if (isTableRow(trimmed) && lines[i + 1] !== undefined && SEPARATOR.test(lines[i + 1].trim())) {
      flush();

      const header = trimmed;
      const separator = lines[i + 1].trim();
      const rows = [];

      i += 2;
      while (i < lines.length && isTableRow(lines[i].trim())) {
        rows.push(lines[i]);
        i += 1;
      }
      i -= 1;

      blocks.push(<Table key={`table-${blocks.length}`} header={header} separator={separator} rows={rows} />);
      continue;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      bullets.push(trimmed.slice(2));
      continue;
    }

    flush();
    if (!trimmed) continue;

    blocks.push(
      <p key={`p-${blocks.length}`}>
        <Inline text={trimmed} />
      </p>,
    );
  }

  flush();

  return <div className="space-y-2.5 text-[13px] leading-relaxed text-gray-700">{blocks}</div>;
}
