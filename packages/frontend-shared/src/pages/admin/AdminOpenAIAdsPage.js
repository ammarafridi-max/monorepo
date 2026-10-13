'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CalendarDays, Loader2, Megaphone, Plus } from 'lucide-react';
import FilterMenu from '../../components/admin/FilterMenu';
import { CampaignSettingsSheet, EditableName, StatusSelect, fmtInt, fmtMoney, fmtPct } from '../../components/admin/OpenAIAdsParts';
import { useOpenAIAdsOverview } from '../../hooks/openai-ads/useOpenAIAdsOverview';

const RANGE_OPTIONS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
];

const GOAL_LABEL = { sales: 'Orders', clicks: 'Clicks', impressions: 'Impressions' };

function Stat({ label, value }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

const COLUMNS = ['Campaign', 'Status', 'Goal', 'Budget / day', 'Spent', 'Impressions', 'Clicks', 'CTR', 'CPC', 'Orders', 'Cost / order'];

export default function AdminOpenAIAdsPage({ basePath = '/admin/chatgpt-ads' }) {
  const [days, setDays] = useState('30');
  const [settingsFor, setSettingsFor] = useState(null);
  const { overview, isLoadingOverview, isErrorOverview, overviewError } = useOpenAIAdsOverview(days);

  const currency = overview?.account?.currency ?? 'AED';
  const totals = overview?.totals;
  const campaigns = overview?.campaigns ?? [];
  const cpc = totals?.clicks ? totals.spend / totals.clicks : null;

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-gray-900">ChatGPT Ads</h2>
        <div className="flex items-center gap-4">
          <FilterMenu value={days} onChange={setDays} options={RANGE_OPTIONS} label="Date range" icon={CalendarDays} />
          <Link
            href={`${basePath}/new`}
            className="inline-flex items-center gap-1.5 bg-primary-700 hover:bg-primary-800 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={15} /> New campaign
          </Link>
        </div>
      </div>

      {isLoadingOverview ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={22} className="animate-spin text-gray-300" />
        </div>
      ) : isErrorOverview ? (
        <div className="bg-white border border-gray-200 rounded-2xl flex flex-col items-center py-16 text-center gap-2">
          <AlertCircle size={22} className="text-red-500" />
          <p className="text-sm text-gray-700">Couldn't load ChatGPT Ads</p>
          <p className="text-xs text-gray-400 max-w-sm">{overviewError?.message}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label="Spent" value={fmtMoney(totals?.spend, currency)} />
            <Stat label="Clicks" value={fmtInt(totals?.clicks)} />
            <Stat label="Orders" value={fmtInt(totals?.orders)} />
            <Stat label="Cost per order" value={totals?.costPerOrder != null ? fmtMoney(totals.costPerOrder, currency) : '—'} />
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            {campaigns.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center gap-2">
                <Megaphone size={22} className="text-gray-300" />
                <p className="text-sm text-gray-500">No campaigns yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[1000px]">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      {COLUMNS.map((h) => (
                        <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {campaigns.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-4 py-3">
                          <EditableName kind="campaigns" id={c.id} name={c.name} href={`${basePath}/${c.id}`} onSettings={() => setSettingsFor(c.id)} />
                          {c.ads?.rejected > 0 && (
                            <p className="text-xs text-red-600 mt-0.5">{c.ads.rejected} ad{c.ads.rejected === 1 ? '' : 's'} rejected</p>
                          )}
                          {!c.ads?.rejected && c.ads?.inReview > 0 && (
                            <p className="text-xs text-blue-600 mt-0.5">{c.ads.inReview} ad{c.ads.inReview === 1 ? '' : 's'} in review</p>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <StatusSelect
                            kind="campaigns"
                            id={c.id}
                            name={c.name}
                            status={c.status}
                            note={c.dailyBudget != null ? `starts showing in ChatGPT and can spend up to ${fmtMoney(c.dailyBudget, currency)} a day.` : undefined}
                          />
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{GOAL_LABEL[c.goal] ?? c.goal ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtMoney(c.dailyBudget, currency)}</td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{fmtMoney(c.spend, currency)}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtInt(c.impressions)}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtInt(c.clicks)}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtPct(c.ctr)}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{c.cpc != null ? fmtMoney(c.cpc, currency) : '—'}</td>
                        <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{fmtInt(c.orders)}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{c.costPerOrder != null ? fmtMoney(c.costPerOrder, currency) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-gray-100 bg-gray-50/60 text-gray-700">
                      <td className="px-4 py-3" colSpan={4}>Total</td>
                      <td className="px-4 py-3 whitespace-nowrap">{fmtMoney(totals?.spend, currency)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{fmtInt(totals?.impressions)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{fmtInt(totals?.clicks)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{totals?.impressions ? fmtPct(totals.clicks / totals.impressions) : '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{cpc != null ? fmtMoney(cpc, currency) : '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{fmtInt(totals?.orders)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{totals?.costPerOrder != null ? fmtMoney(totals.costPerOrder, currency) : '—'}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {overview?.own && (
            <p className="text-xs text-gray-400">
              Orders are what OpenAI credits to your ads. Your own records show {overview.own.orders} paid order
              {overview.own.orders === 1 ? '' : 's'} from a ChatGPT ad click in the same period.
            </p>
          )}
        </>
      )}
      {settingsFor && <CampaignSettingsSheet campaignId={settingsFor} onClose={() => setSettingsFor(null)} />}
    </div>
  );
}
