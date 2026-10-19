'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Database,
  Eye,
  Loader2,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { useAssistantAudit, useAssistantUsage } from '../../hooks/assistant/useAssistantAudit';

const DAY_TABS = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
];

const TOOL_LABELS = {
  count_records: 'Count',
  aggregate_records: 'Aggregate',
  find_records: 'List',
  get_record: 'Lookup',
  stripe_balance: 'Stripe balance',
  stripe_revenue: 'Stripe revenue',
  stripe_transactions: 'Stripe transactions',
  stripe_payouts: 'Stripe payouts',
  stripe_disputes: 'Stripe disputes',
  stripe_find_payments: 'Stripe charges',
};

const number = (value) => (value ?? 0).toLocaleString();

function StatTile({ icon: Icon, label, value, hint, tone = 'default' }) {
  const tones = {
    default: 'text-gray-900',
    warn: 'text-amber-600',
    alert: 'text-red-600',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <div className="flex items-center gap-2 text-gray-400">
        <Icon size={14} />
        <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
      </div>
      <p className={`mt-2 text-2xl font-bold tabular-nums ${tones[tone]}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function Th({ children, className = '' }) {
  return (
    <th className={`text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap ${className}`}>
      {children}
    </th>
  );
}

export default function AdminAssistantPage() {
  const [days, setDays] = useState(30);
  const [page, setPage] = useState(1);
  const [dataset, setDataset] = useState('');

  const { usage, isLoadingUsage } = useAssistantUsage(days);
  const { calls, pagination, isLoadingAudit } = useAssistantAudit({ page, limit: 50, dataset });

  const tokens = (usage?.totals.inputTokens ?? 0) + (usage?.totals.outputTokens ?? 0);
  const datasets = [...new Set((usage?.tools ?? []).map((tool) => tool.tool))];

  return (
    <div className="max-w-7xl mx-auto space-y-5">

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles size={18} className="text-primary-700" />
            Assistant
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Every question the assistant answered, and what it read to answer it.
          </p>
        </div>

        <div className="inline-flex gap-0.5 rounded-xl bg-gray-100 p-0.5">
          {DAY_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setDays(tab.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                days === tab.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {isLoadingUsage ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4 h-[104px] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile
            icon={MessageSquare}
            label="Conversations"
            value={number(usage?.totals.conversations)}
            hint={`${number(usage?.totals.requests)} model requests`}
          />
          <StatTile
            icon={Database}
            label="Tokens"
            value={number(tokens)}
            hint={`${number(usage?.totals.cacheReadTokens)} read from cache`}
          />
          <StatTile
            icon={Eye}
            label="Unmasked reads"
            value={number(usage?.unmasked)}
            hint="Calls that returned raw customer data"
            tone={usage?.unmasked ? 'warn' : 'default'}
          />
          <StatTile
            icon={AlertTriangle}
            label="Refused or failed"
            value={number(usage?.failures)}
            hint="Tool calls that returned an error"
            tone={usage?.failures ? 'alert' : 'default'}
          />
        </div>
      )}

      {usage?.users?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-800">Who is using it</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <Th>User</Th>
                  <Th>Conversations</Th>
                  <Th>Input tokens</Th>
                  <Th>Output tokens</Th>
                </tr>
              </thead>
              <tbody>
                {usage.users.map((row) => (
                  <tr key={row.user} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{row.user}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 tabular-nums">{number(row.conversations)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 tabular-nums">{number(row.inputTokens)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 tabular-nums">{number(row.outputTokens)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-gray-800">Tool call log</h2>
          <select
            value={dataset}
            onChange={(event) => {
              setDataset(event.target.value);
              setPage(1);
            }}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none focus:border-gray-300"
          >
            <option value="">All datasets</option>
            {datasets.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </div>

        {isLoadingAudit ? (
          <div className="flex items-center justify-center py-12 text-gray-300">
            <Loader2 size={22} className="animate-spin" />
          </div>
        ) : !calls.length ? (
          <div className="flex flex-col items-center gap-2 py-12">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Database size={20} className="text-gray-300" />
            </div>
            <p className="text-sm text-gray-400">Nothing logged yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <Th>When</Th>
                  <Th>User</Th>
                  <Th>Tool</Th>
                  <Th>Dataset</Th>
                  <Th>Rows</Th>
                  <Th>Took</Th>
                  <Th>Result</Th>
                </tr>
              </thead>
              <tbody>
                {calls.map((call) => (
                  <tr key={call.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(call.at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">
                      {call.user || 'unknown'}
                      {call.role && <span className="ml-1.5 text-xs text-gray-400 capitalize">{call.role}</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {TOOL_LABELS[call.tool] ?? call.tool}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{call.dataset || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 tabular-nums">{number(call.rowCount)}</td>
                    <td className="px-4 py-3 text-sm text-gray-400 tabular-nums whitespace-nowrap">{call.durationMs}ms</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {call.error ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                          Refused
                        </span>
                      ) : call.unmasked ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                          <Eye size={11} />
                          Unmasked
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-500">
                          Ok
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Page {pagination.page} of {pagination.pages} · {number(pagination.total)} calls
            </p>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                onClick={() => setPage((value) => value + 1)}
                disabled={pagination.page >= pagination.pages}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
