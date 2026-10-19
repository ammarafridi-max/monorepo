'use client';

import Link from 'next/link';

const BOLD = /\*\*(.+?)\*\*/g;
const ADMIN_PATH = /(\/admin[\w\-/]*)/g;
const SEPARATOR = /^\|?[\s:|-]*-[\s:|-]*\|?$/;

function Inline({ text }) {
  const parts = String(text ?? '').split(BOLD);

  return parts.map((part, index) => {
    const bold = index % 2 === 1;
    const segments = part.split(ADMIN_PATH);

    const nodes = segments.map((segment, segmentIndex) =>
      segmentIndex % 2 === 1 ? (
        <Link
          key={`${index}-${segmentIndex}`}
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
      <strong key={index} className="font-semibold text-gray-900">
        {nodes}
      </strong>
    ) : (
      <span key={index}>{nodes}</span>
    );
  });
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

function Table({ header, separator, rows }) {
  const headings = splitRow(header);
  const aligned = alignmentsFrom(separator);
  const body = rows.map(splitRow);
  const numeric = numericColumns(body, headings.length);

  const alignFor = (column) => {
    if (aligned[column] && aligned[column] !== 'text-left') return aligned[column];
    return numeric[column] ? 'text-right' : 'text-left';
  };

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

export default function AssistantText({ text }) {
  const lines = String(text ?? '').split('\n');
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
