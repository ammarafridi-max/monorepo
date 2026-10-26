'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, CalendarDays, ChevronDown, ChevronRight, Eye, Loader2, Pencil, Plus } from 'lucide-react';
import FilterMenu from '../../components/admin/FilterMenu';
import {
  AdFields,
  AdGroupSettingsSheet,
  AudienceFields,
  CampaignSettingsSheet,
  DeleteAction,
  EditableName,
  ReviewPill,
  Sheet,
  StatusSelect,
  adIsReady,
  audiencePayload,
  emptyAd,
  emptyAudience,
  fmtInt,
  fmtMoney,
  fmtPct,
} from '../../components/admin/OpenAIAdsParts';
import { useOpenAIAdsCampaign } from '../../hooks/openai-ads/useOpenAIAdsCampaign';
import { useOpenAIAdsSetup } from '../../hooks/openai-ads/useOpenAIAdsSetup';
import {
  useCreateOpenAIAd,
  useCreateOpenAIAdGroup,
  useEditOpenAIAd,
  usePreviewOpenAIAd,
} from '../../hooks/openai-ads/useOpenAIAdsMutations';

const RANGE_OPTIONS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
];

const COLUMNS = ['Ad group', 'Status', 'Bid', 'Spent', 'Impressions', 'Clicks', 'CTR', 'CPC', 'Orders', 'Cost / order', ''];

function Stat({ label, value }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function MetricCells({ row, currency, strong = false }) {
  const main = strong ? 'text-gray-900' : 'text-gray-600';
  return (
    <>
      <td className={`px-4 py-3 whitespace-nowrap ${main}`}>{fmtMoney(row.spend, currency)}</td>
      <td className="px-4 py-3 whitespace-nowrap text-gray-600">{fmtInt(row.impressions)}</td>
      <td className="px-4 py-3 whitespace-nowrap text-gray-600">{fmtInt(row.clicks)}</td>
      <td className="px-4 py-3 whitespace-nowrap text-gray-600">{fmtPct(row.ctr)}</td>
      <td className="px-4 py-3 whitespace-nowrap text-gray-600">{row.cpc != null ? fmtMoney(row.cpc, currency) : '—'}</td>
      <td className={`px-4 py-3 whitespace-nowrap ${main}`}>{fmtInt(row.orders)}</td>
      <td className="px-4 py-3 whitespace-nowrap text-gray-600">{row.costPerOrder != null ? fmtMoney(row.costPerOrder, currency) : '—'}</td>
    </>
  );
}

function SubmitButton({ label, disabled, isPending, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isPending}
      className="w-full inline-flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition disabled:opacity-50"
    >
      {isPending && <Loader2 size={14} className="animate-spin" />}
      {label}
    </button>
  );
}

function EditAdSheet({ ad: existing, adGroupId, onClose }) {
  const [ad, setAd] = useState({
    title: existing.title ?? '',
    body: existing.body ?? '',
    targetUrl: existing.targetUrl ?? '',
    imageFileId: existing.imageFileId ?? '',
    imageCrop: existing.imageCrop ?? null,
    imagePreview: '',
  });
  const { mutate, isPending } = useEditOpenAIAd();

  return (
    <Sheet title="Edit ad" onClose={() => !isPending && onClose()}>
      {existing.reviewReason && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
          {existing.reviewReason} OpenAI does not say which policy was broken.
        </p>
      )}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-gray-400">Saving sends the ad back to OpenAI for review. It keeps its stats.</p>
        <PreviewButton adId={existing.id} label="Preview" />
      </div>
      <AdFields ad={ad} onChange={setAd} keptImage={!ad.imagePreview && Boolean(ad.imageFileId)} />
      <SubmitButton
        label="Save ad"
        disabled={!adIsReady(ad)}
        isPending={isPending}
        onClick={() => mutate({ adId: existing.id, adGroupId, ...ad }, { onSuccess: onClose })}
      />
    </Sheet>
  );
}

function NewAdSheet({ adGroupId, website, onClose }) {
  const [ad, setAd] = useState(emptyAd(website));
  const { mutate, isPending } = useCreateOpenAIAd();
  return (
    <Sheet title="New ad" onClose={() => !isPending && onClose()}>
      <AdFields ad={ad} onChange={setAd} />
      <SubmitButton label="Create ad" disabled={!adIsReady(ad)} isPending={isPending} onClick={() => mutate({ adGroupId, ...ad }, { onSuccess: onClose })} />
    </Sheet>
  );
}

function NewAdGroupSheet({ campaign, website, currency, onClose }) {
  const [audience, setAudience] = useState(emptyAudience());
  const [ad, setAd] = useState(emptyAd(website));
  const { mutate, isPending } = useCreateOpenAIAdGroup();
  const ready = audience.name.trim().length >= 3 && Number(audience.bid) > 0 && adIsReady(ad);
  return (
    <Sheet title="New ad group" onClose={() => !isPending && onClose()}>
      <AudienceFields audience={audience} onChange={setAudience} goal={campaign.goal} currency={currency} showName />
      <div className="border-t border-gray-100 pt-4">
        <p className="text-sm font-medium text-gray-700 mb-4">First ad</p>
        <AdFields ad={ad} onChange={setAd} />
      </div>
      <SubmitButton
        label="Create ad group"
        disabled={!ready}
        isPending={isPending}
        onClick={() => mutate({ campaignId: campaign.id, adGroup: audiencePayload(audience), ad }, { onSuccess: onClose })}
      />
    </Sheet>
  );
}

function PreviewButton({ adId, label }) {
  const { previewAd, isPreviewing } = usePreviewOpenAIAd();
  async function open() {
    const res = await previewAd(adId).catch(() => null);
    if (res?.url) window.open(res.url, '_blank', 'noopener');
  }
  return (
    <button
      onClick={open}
      disabled={isPreviewing}
      title="See how this ad looks in ChatGPT"
      className="inline-flex items-center gap-1.5 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition disabled:opacity-60"
    >
      {isPreviewing ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
      {label && <span className="text-xs font-medium">{label}</span>}
    </button>
  );
}

function AdMetric({ label, value }) {
  return (
    <span className="text-xs text-gray-500">
      {label} <span className="font-medium text-gray-800">{value}</span>
    </span>
  );
}

function AdCard({ ad, currency, onEdit }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onEdit}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onEdit();
        }
      }}
      className="group/ad bg-white border border-gray-200 rounded-xl p-3 cursor-pointer transition hover:border-primary-300 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900">{ad.title || ad.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{ad.body}</p>
          <p className="text-[11px] text-gray-400 mt-1 truncate">{ad.targetUrl}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <ReviewPill review={ad.review} reason={ad.reviewReason} />
          <StatusSelect kind="ads" id={ad.id} name={ad.title || ad.name} status={ad.status} />
          <PreviewButton adId={ad.id} />
          <DeleteAction kind="ads" id={ad.id} name={ad.title || ad.name} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5 pt-2.5 border-t border-gray-100">
        <AdMetric label="Spent" value={fmtMoney(ad.spend, currency)} />
        <AdMetric label="Impressions" value={fmtInt(ad.impressions)} />
        <AdMetric label="Clicks" value={fmtInt(ad.clicks)} />
        <AdMetric label="CTR" value={fmtPct(ad.ctr)} />
        <AdMetric label="CPC" value={ad.cpc != null ? fmtMoney(ad.cpc, currency) : '—'} />
        <AdMetric label="Orders" value={fmtInt(ad.orders)} />
        <AdMetric label="Cost / order" value={ad.costPerOrder != null ? fmtMoney(ad.costPerOrder, currency) : '—'} />
        <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-primary-700 opacity-0 group-hover/ad:opacity-100 transition-opacity">
          <Pencil size={12} /> Edit
        </span>
      </div>
    </div>
  );
}

export default function AdminOpenAIAdsCampaignPage({ basePath = '/admin/chatgpt-ads' }) {
  const { id } = useParams();
  const router = useRouter();
  const [days, setDays] = useState('30');
  const { campaign, isLoadingCampaign, campaignError } = useOpenAIAdsCampaign(id, days);
  const { setup } = useOpenAIAdsSetup();
  const [open, setOpen] = useState({});
  const [sheet, setSheet] = useState(null);

  const currency = campaign?.currency ?? setup?.currency ?? 'AED';
  const website = setup?.website ?? '';
  const toggle = (groupId) => setOpen((prev) => ({ ...prev, [groupId]: !prev[groupId] }));

  if (isLoadingCampaign) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={22} className="animate-spin text-gray-300" />
      </div>
    );
  }
  if (!campaign) {
    return (
      <div className="flex flex-col items-center py-20 gap-3 text-center">
        <AlertCircle size={22} className="text-red-500" />
        <p className="text-sm text-gray-600">{campaignError?.message || 'Campaign not found.'}</p>
        <Link href={basePath} className="text-sm text-primary-700 hover:underline">Back to ChatGPT Ads</Link>
      </div>
    );
  }

  const totals = campaign.totals;

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-wrap items-start gap-3">
        <Link href={basePath} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-semibold">
              <EditableName kind="campaigns" id={campaign.id} name={campaign.name} onSettings={() => setSheet({ type: 'campaign-settings' })} />
            </h2>
            <StatusSelect
              kind="campaigns"
              id={campaign.id}
              name={campaign.name}
              status={campaign.status}
              note={campaign.dailyBudget != null ? `starts showing in ChatGPT and can spend up to ${fmtMoney(campaign.dailyBudget, currency)} a day.` : undefined}
            />
            <DeleteAction kind="campaigns" id={campaign.id} name={campaign.name} onDeleted={() => router.push(basePath)} />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {[
              campaign.goal === 'sales' ? 'Goal: orders' : 'Goal: clicks',
              campaign.dailyBudget != null && `${fmtMoney(campaign.dailyBudget, currency)} a day`,
              campaign.locations.join(', '),
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <FilterMenu value={days} onChange={setDays} options={RANGE_OPTIONS} label="Date range" icon={CalendarDays} />
          <button
            onClick={() => setSheet({ type: 'group' })}
            className="inline-flex items-center gap-1.5 bg-primary-700 hover:bg-primary-800 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={15} /> New ad group
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Spent" value={fmtMoney(totals?.spend, currency)} />
        <Stat label="Clicks" value={fmtInt(totals?.clicks)} />
        <Stat label="Orders" value={fmtInt(totals?.orders)} />
        <Stat label="Cost per order" value={totals?.costPerOrder != null ? fmtMoney(totals.costPerOrder, currency) : '—'} />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {campaign.adGroups.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center gap-2">
            <p className="text-sm text-gray-500">No ad groups yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1000px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {COLUMNS.map((h, i) => (
                    <th key={i} className="text-left text-xs font-medium text-gray-500 px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {campaign.adGroups.map((group) => {
                  const isOpen = Boolean(open[group.id]);
                  const rejected = group.ads.filter((a) => a.review === 'rejected').length;
                  return (
                    <Fragment key={group.id}>
                      <tr className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => toggle(group.id)} title={isOpen ? 'Hide ads' : 'Show ads'} className="text-gray-400 hover:text-gray-700">
                              {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                            </button>
                            <EditableName
                              kind="ad-groups"
                              id={group.id}
                              name={group.name}
                              onSettings={() => setSheet({ type: 'group-settings', adGroupId: group.id })}
                            />
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5 ml-6">
                            {group.ads.length} ad{group.ads.length === 1 ? '' : 's'}
                            {rejected > 0 && <span className="text-red-600"> · {rejected} rejected</span>}
                          </p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <StatusSelect kind="ad-groups" id={group.id} name={group.name} status={group.status} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                          {group.bid != null ? fmtMoney(group.bid, currency) : <span className="text-gray-400">Automatic</span>}
                        </td>
                        <MetricCells row={group} currency={currency} strong />
                        <td className="px-4 py-3">
                          <DeleteAction kind="ad-groups" id={group.id} name={group.name} />
                        </td>
                      </tr>

                      {isOpen && (
                        <tr>
                          <td colSpan={COLUMNS.length} className="pl-10 pr-4 pb-4 pt-1">
                            <div className="bg-gray-100 rounded-2xl p-3 space-y-2">
                              {group.ads.length === 0 ? (
                                <p className="text-xs text-gray-500 px-1 py-2">No ads in this ad group yet.</p>
                              ) : (
                                group.ads.map((ad) => (
                                  <AdCard
                                    key={ad.id}
                                    ad={ad}
                                    currency={currency}
                                    onEdit={() => setSheet({ type: 'edit-ad', ad, adGroupId: group.id })}
                                  />
                                ))
                              )}
                              <button
                                onClick={() => setSheet({ type: 'ad', adGroupId: group.id })}
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-700 hover:text-primary-800 px-1 pt-1"
                              >
                                <Plus size={13} /> Add ad
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-100 bg-gray-50/60 text-gray-700">
                  <td className="px-4 py-3" colSpan={3}>Total</td>
                  <MetricCells row={totals} currency={currency} />
                  <td className="px-4 py-3" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {sheet?.type === 'ad' && <NewAdSheet adGroupId={sheet.adGroupId} website={website} onClose={() => setSheet(null)} />}
      {sheet?.type === 'edit-ad' && (
        <EditAdSheet ad={sheet.ad} adGroupId={sheet.adGroupId} onClose={() => setSheet(null)} />
      )}
      {sheet?.type === 'group' && <NewAdGroupSheet campaign={campaign} website={website} currency={currency} onClose={() => setSheet(null)} />}
      {sheet?.type === 'campaign-settings' && <CampaignSettingsSheet campaignId={campaign.id} onClose={() => setSheet(null)} />}
      {sheet?.type === 'group-settings' && (
        <AdGroupSettingsSheet
          adGroupId={sheet.adGroupId}
          campaignId={campaign.id}
          goal={campaign.goal}
          currency={currency}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  );
}
