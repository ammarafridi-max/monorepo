'use client';

import { AlertTriangle, Check, Loader2, ShieldAlert, X } from 'lucide-react';

const STATE = {
  executed: {
    cls: 'border-green-200 bg-green-50',
    icon: Check,
    iconCls: 'text-green-600',
    label: 'Approved and done',
  },
  cancelled: {
    cls: 'border-gray-200 bg-gray-50',
    icon: X,
    iconCls: 'text-gray-400',
    label: 'Cancelled',
  },
  failed: {
    cls: 'border-red-200 bg-red-50',
    icon: AlertTriangle,
    iconCls: 'text-red-600',
    label: 'Did not go through',
  },
};

export default function AssistantProposal({ proposal, onDecide, deciding }) {
  const settled = STATE[proposal.status];

  if (settled) {
    const Icon = settled.icon;
    return (
      <div className={`rounded-xl border px-3 py-2.5 ${settled.cls}`}>
        <div className="flex items-start gap-2">
          <Icon size={14} className={`mt-0.5 shrink-0 ${settled.iconCls}`} />
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-gray-800">{settled.label}</p>
            <p className="text-[12px] text-gray-600">{proposal.summary}</p>
            {proposal.error && <p className="mt-1 text-[11px] text-red-700">{proposal.error}</p>}
            {proposal.result?.warnings?.map((warning) => (
              <p key={warning} className="mt-1 text-[11px] text-amber-700">
                {warning}
              </p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-3">
      <div className="flex items-start gap-2">
        <ShieldAlert size={14} className="mt-0.5 shrink-0 text-amber-600" />
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-gray-900">{proposal.summary}</p>
          <p className="mt-0.5 text-[11px] text-amber-700">
            Nothing has changed yet. This runs only if you approve it.
          </p>

          {proposal.details?.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {proposal.details.map((line) => (
                <li key={line} className="text-[12px] text-gray-700">
                  {line}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => onDecide({ id: proposal.id, approve: true })}
              disabled={deciding}
              className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
            >
              {deciding ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              Approve
            </button>
            <button
              type="button"
              onClick={() => onDecide({ id: proposal.id, approve: false })}
              disabled={deciding}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
