'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, ImagePlus, Info, Loader2, Pencil, Settings2, Trash2, X } from 'lucide-react';
import {
  useRenameOpenAIAds,
  useSetOpenAIAdsStatus,
  useUpdateOpenAIAdGroupSettings,
  useUpdateOpenAICampaignSettings,
  useUploadOpenAIAdImage,
} from '../../hooks/openai-ads/useOpenAIAdsMutations';
import { useOpenAIAdGroupSettings, useOpenAICampaignSettings } from '../../hooks/openai-ads/useOpenAIAdsSettings';
import { searchOpenAIAdsLocationsApi } from '../../services/apiOpenAIAds';
import { fmtMoneyCompact as fmtMoney, fmtInt, fmtPct } from './format';
import { Sheet } from './ModalShell';
import { inputFieldCls as inputCls } from './formClasses';
export { fmtMoney, fmtInt, fmtPct };
export { Sheet };
export { inputCls };


const STATUS_CFG = {
  active:   { label: 'Running', cls: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
  paused:   { label: 'Paused',  cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  archived: { label: 'Archived', cls: 'bg-gray-100 text-gray-500 border-gray-200', dot: 'bg-gray-400' },
};

const REVIEW_CFG = {
  approved:  { label: 'Approved', cls: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
  in_review: { label: 'In review', cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  rejected:  { label: 'Rejected', cls: 'bg-red-50 text-red-600 border-red-200', dot: 'bg-red-500' },
};

function Pill({ cfg, title, hint }) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border whitespace-nowrap ${cfg.cls} ${
        title ? 'cursor-help' : ''
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
      {hint}
    </span>
  );
}

export const AD_METRICS = [
  { label: 'Spent', strong: true, value: (row, currency) => fmtMoney(row.spend, currency) },
  { label: 'Impressions', value: (row) => fmtInt(row.impressions) },
  { label: 'Clicks', value: (row) => fmtInt(row.clicks) },
  { label: 'CTR', value: (row) => fmtPct(row.ctr) },
  { label: 'CPC', value: (row, currency) => (row.cpc != null ? fmtMoney(row.cpc, currency) : '—') },
  { label: 'Orders', strong: true, value: (row) => fmtInt(row.orders) },
  { label: 'Cost / order', value: (row, currency) => (row.costPerOrder != null ? fmtMoney(row.costPerOrder, currency) : '—') },
];

export function MetricCells({ row, currency, strong = false }) {
  return (
    <>
      {AD_METRICS.map((metric) => (
        <td
          key={metric.label}
          className={`px-4 py-3 whitespace-nowrap ${strong && metric.strong ? 'text-gray-900' : 'text-gray-600'}`}
        >
          {metric.value(row, currency)}
        </td>
      ))}
    </>
  );
}

export function StatusPill({ status }) {
  return <Pill cfg={STATUS_CFG[status] ?? { label: status, cls: 'bg-gray-100 text-gray-500 border-gray-200', dot: 'bg-gray-400' }} />;
}

export function ReviewPill({ review, reason }) {
  if (!review) return null;

  const cfg = REVIEW_CFG[review] ?? { label: review, cls: 'bg-gray-100 text-gray-500 border-gray-200', dot: 'bg-gray-400' };
  const title = reason
    ? `${reason}\n\nOpenAI does not say which policy was broken. Ask the assistant to look at the wording.`
    : review === 'in_review'
      ? 'OpenAI is still reviewing this ad. Nothing is wrong with it.'
      : undefined;

  return <Pill cfg={cfg} title={title} hint={reason ? <Info size={11} className="opacity-70" /> : null} />;
}

const KIND_NOUN = { campaigns: 'campaign', 'ad-groups': 'ad group', ads: 'ad' };

export function EditableName({ kind, id, name, href, className = 'text-gray-900', onSettings }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const inputRef = useRef(null);
  const { mutate, isPending } = useRenameOpenAIAds();

  useEffect(() => {
    if (!editing) setValue(name);
  }, [name, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function save() {
    const next = value.trim();
    if (next.length < 3 || next === name) {
      setEditing(false);
      setValue(name);
      return;
    }
    mutate({ kind, id, name: next }, { onSuccess: () => setEditing(false) });
  }

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <input
          ref={inputRef}
          value={value}
          maxLength={200}
          disabled={isPending}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') {
              setEditing(false);
              setValue(name);
            }
          }}
          className="px-2 py-1 text-sm border border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[240px]"
        />
        <button onClick={save} disabled={isPending} title="Save" className="p-1 rounded-md text-primary-700 hover:bg-primary-50">
          {isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
        </button>
        <button
          onClick={() => {
            setEditing(false);
            setValue(name);
          }}
          disabled={isPending}
          title="Cancel"
          className="p-1 rounded-md text-gray-400 hover:bg-gray-100"
        >
          <X size={14} />
        </button>
      </span>
    );
  }

  return (
    <span className="group/name inline-flex items-center gap-1.5">
      {href ? (
        <Link href={href} className={`${className} hover:text-primary-700 hover:underline`}>
          {name}
        </Link>
      ) : (
        <span className={className}>{name}</span>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
        title="Rename"
        className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 opacity-0 group-hover/name:opacity-100 focus:opacity-100 transition-opacity"
      >
        <Pencil size={13} />
      </button>
      {onSettings && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSettings();
          }}
          title="Settings"
          className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 opacity-0 group-hover/name:opacity-100 focus:opacity-100 transition-opacity"
        >
          <Settings2 size={13} />
        </button>
      )}
    </span>
  );
}

const SELECT_OPTIONS = [
  { value: 'active', label: 'Running' },
  { value: 'paused', label: 'Paused' },
  { value: 'archived', label: 'Archive' },
];

const ACTION_FOR = { active: 'activate', paused: 'pause', archived: 'archive' };

export function StatusSelect({ kind, id, name, status, note }) {
  const [target, setTarget] = useState(null);
  const { mutate, isPending } = useSetOpenAIAdsStatus();
  const noun = KIND_NOUN[kind];
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.archived;

  if (status === 'archived') return <StatusPill status="archived" />;

  const copy = {
    active: { title: `Turn on this ${noun}?`, text: note || 'can start showing in ChatGPT and spending.', button: 'Turn on', cls: 'bg-primary-600 hover:bg-primary-700' },
    paused: { title: `Pause this ${noun}?`, text: 'stops showing in ChatGPT straight away.', button: 'Pause', cls: 'bg-amber-600 hover:bg-amber-700' },
    archived: { title: `Archive this ${noun}?`, text: 'stops for good. Archiving cannot be undone.', button: 'Archive', cls: 'bg-red-600 hover:bg-red-700' },
  }[target];

  return (
    <>
      <div className={`relative inline-flex items-center rounded-full border ${cfg.cls}`}>
        <span className={`absolute left-2.5 w-1.5 h-1.5 rounded-full pointer-events-none ${cfg.dot}`} />
        <select
          value={status}
          onChange={(e) => e.target.value !== status && setTarget(e.target.value)}
          disabled={isPending}
          className="appearance-none bg-transparent text-xs font-medium pl-6 pr-6 py-1 rounded-full cursor-pointer focus:outline-none"
        >
          {SELECT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <span className="absolute right-2 text-[9px] pointer-events-none opacity-60">▼</span>
      </div>
      {copy && (
        <Sheet title={copy.title} onClose={() => !isPending && setTarget(null)}>
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">{name}</span> {copy.text}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setTarget(null)}
              className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              disabled={isPending}
              onClick={() => mutate({ kind, id, action: ACTION_FOR[target] }, { onSettled: () => setTarget(null) })}
              className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white rounded-xl transition disabled:opacity-60 ${copy.cls}`}
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {copy.button}
            </button>
          </div>
        </Sheet>
      )}
    </>
  );
}

export function DeleteAction({ kind, id, name, onDeleted }) {
  const [confirming, setConfirming] = useState(false);
  const { mutate, isPending } = useSetOpenAIAdsStatus();
  const noun = KIND_NOUN[kind];

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setConfirming(true);
        }}
        title={`Delete this ${noun}`}
        className="inline-flex items-center gap-1.5 p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
      >
        <Trash2 size={14} />
      </button>
      {confirming && (
        <Sheet title={`Delete this ${noun}?`} onClose={() => !isPending && setConfirming(false)}>
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">{name}</span> stops showing in ChatGPT straight away and leaves your lists.
          </p>
          <p className="text-xs text-gray-400">
            OpenAI has no delete, so this archives the {noun} instead. That cannot be undone, and you cannot turn it back on.
            Its past spend and results stay in OpenAI reporting.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirming(false)}
              className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              disabled={isPending}
              onClick={() =>
                mutate(
                  { kind, id, action: 'archive' },
                  {
                    onSuccess: () => onDeleted?.(),
                    onSettled: () => setConfirming(false),
                  },
                )
              }
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition disabled:opacity-60"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              Delete
            </button>
          </div>
        </Sheet>
      )}
    </>
  );
}

export function Field({ label, hint, counter, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-xs font-medium text-gray-500">{label}</label>
        {counter}
      </div>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function Counter({ value, max }) {
  const n = value.length;
  return <span className={`text-xs ${n > max ? 'text-red-600 font-medium' : 'text-gray-400'}`}>{n}/{max}</span>;
}

export const emptyAd = (website = '') => ({ title: '', body: '', targetUrl: website, imageFileId: '', imageCrop: null, imagePreview: '' });

export function adIsReady(ad) {
  return ad.title.trim().length >= 3 && ad.title.length <= 50 && ad.body.trim() && ad.body.length <= 100 && ad.targetUrl.trim() && ad.imageFileId;
}

export function AdFields({ ad, onChange, keptImage = false }) {
  const fileRef = useRef(null);
  const { uploadImage, isUploadingImage } = useUploadOpenAIAdImage();
  const set = (key, value) => onChange({ ...ad, [key]: value });

  async function pickImage(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const preview = URL.createObjectURL(file);
    try {
      const { fileId } = await uploadImage(file);
      onChange({ ...ad, imageFileId: fileId, imagePreview: preview, imageCrop: null });
    } catch {
      URL.revokeObjectURL(preview);
    }
  }

  return (
    <div className="space-y-4">
      <Field label="Headline" counter={<Counter value={ad.title} max={50} />}>
        <input className={inputCls} value={ad.title} onChange={(e) => set('title', e.target.value)} placeholder="Dummy ticket for Schengen visa from AED 49" />
      </Field>
      <Field label="Text" counter={<Counter value={ad.body} max={100} />}>
        <textarea rows={2} className={inputCls} value={ad.body} onChange={(e) => set('body', e.target.value)} placeholder="Verifiable reservation, accepted by VFS. Delivered in minutes, 24/7." />
      </Field>
      <Field label="Link" hint="Must be a page on your own website.">
        <input className={inputCls} value={ad.targetUrl} onChange={(e) => set('targetUrl', e.target.value)} placeholder="https://" />
      </Field>
      <Field label="Image" hint={keptImage ? 'The current image stays unless you upload a new one. OpenAI does not give it back as a thumbnail, so use Preview to see it.' : 'PNG, JPG or WebP, up to 5 MB.'}>
        <div className="flex items-center gap-3">
          {ad.imagePreview ? (
            <img src={ad.imagePreview} alt="" className="w-20 h-14 object-cover rounded-lg border border-gray-200" />
          ) : (
            <div className="w-20 h-14 rounded-lg border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-center text-[10px] leading-tight text-gray-400 px-1">
              {keptImage ? 'Current image' : ''}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={isUploadingImage}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
          >
            {isUploadingImage ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
            {ad.imageFileId ? 'Change image' : 'Upload image'}
          </button>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={pickImage} />
        </div>
      </Field>
    </div>
  );
}

export const emptyAudience = () => ({ name: '', hints: '', bid: '' });

export function audiencePayload(audience) {
  return {
    name: audience.name,
    contextHints: audience.hints.split('\n').map((h) => h.trim()).filter(Boolean),
    bid: Number(audience.bid),
  };
}

export function AudienceFields({ audience, onChange, goal, currency, showName = false }) {
  const set = (key, value) => onChange({ ...audience, [key]: value });
  return (
    <div className="space-y-4">
      {showName && (
        <Field label="Ad group name">
          <input className={inputCls} value={audience.name} onChange={(e) => set('name', e.target.value)} placeholder="Schengen visa travellers" />
        </Field>
      )}
      <Field label="Who is this for?" hint="One whole idea per line. Commas inside a line are fine, so keep a list on one line.">
        <textarea
          rows={3}
          className={inputCls}
          value={audience.hints}
          onChange={(e) => set('hints', e.target.value)}
          placeholder={'People applying for a Schengen visa\nTravellers who need proof of onward travel'}
        />
      </Field>
      <Field
        label={goal === 'sales' ? `Target cost per order (${currency})` : `Max cost per click (${currency})`}
        hint={goal === 'sales' ? 'What you are happy to pay for one order. OpenAI aims for this.' : 'The most you will pay for one click.'}
      >
        <input type="number" min="0" step="0.5" className={inputCls} value={audience.bid} onChange={(e) => set('bid', e.target.value)} />
      </Field>
    </div>
  );
}

export function LocationPicker({ value, onChange }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return undefined;
    }
    const t = setTimeout(async () => {
      try {
        setResults(await searchOpenAIAdsLocationsApi(query.trim()));
      } catch {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const add = (loc) => {
    if (!value.some((v) => v.id === loc.id)) onChange([...value, loc]);
    setQuery('');
    setResults([]);
  };

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((loc) => (
            <span key={loc.id} className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-200">
              {loc.name}
              <button type="button" onClick={() => onChange(value.filter((v) => v.id !== loc.id))} className="hover:text-primary-900">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <input className={inputCls} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Type a country or city, e.g. United Arab Emirates" />
        {results.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            {results.map((loc) => (
              <button
                key={loc.id}
                type="button"
                onClick={() => add(loc)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex justify-between gap-3"
              >
                <span>{loc.name}</span>
                <span className="text-xs text-gray-400 capitalize">{loc.type}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const GOAL_TEXT = { sales: 'Get orders', clicks: 'Get clicks', impressions: 'Get impressions' };

function SettingsSheet({ title, isLoading, settings, error, onClose, children }) {
  return (
    <Sheet title={title} onClose={onClose}>
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 size={20} className="animate-spin text-gray-300" />
        </div>
      ) : settings ? (
        children
      ) : (
        <p className="text-sm text-red-600">{error?.message || 'Could not load the settings.'}</p>
      )}
    </Sheet>
  );
}

function SaveButton({ disabled, isPending, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isPending}
      className="w-full inline-flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition disabled:opacity-50"
    >
      {isPending && <Loader2 size={14} className="animate-spin" />}
      Save
    </button>
  );
}

function CampaignSettingsForm({ settings, onClose }) {
  const [dailyBudget, setDailyBudget] = useState(settings.dailyBudget ?? '');
  const [locations, setLocations] = useState(settings.locations);
  const [startDate, setStartDate] = useState(settings.startDate);
  const [endDate, setEndDate] = useState(settings.endDate);
  const { mutate, isPending } = useUpdateOpenAICampaignSettings();
  const currency = settings.currency ?? 'AED';
  const budget = Number(dailyBudget);
  const problem =
    !(budget > 0) ? 'Set a daily budget'
    : budget > settings.maxDailyBudget ? `Daily budget can be at most ${fmtMoney(settings.maxDailyBudget, currency)}`
    : !locations.length ? 'Choose at least one location'
    : startDate && endDate && endDate < startDate ? 'End date must be after the start date'
    : null;

  return (
    <div className="space-y-4">
      <Field label="Goal" hint="OpenAI does not allow changing the goal after a campaign is created.">
        <p className="text-sm text-gray-700">{GOAL_TEXT[settings.goal] ?? settings.goal}</p>
      </Field>
      <Field label={`Daily budget (${currency})`} hint={`Up to ${fmtMoney(settings.maxDailyBudget, currency)} a day.`}>
        <input type="number" min="1" max={settings.maxDailyBudget} className={inputCls} value={dailyBudget} onChange={(e) => setDailyBudget(e.target.value)} />
      </Field>
      <Field label="Where to show it">
        <LocationPicker value={locations} onChange={setLocations} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Start date">
          <input type="date" className={inputCls} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </Field>
        <Field label="End date" hint="Leave empty to keep running.">
          <input type="date" className={inputCls} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </Field>
      </div>
      {problem && <p className="text-sm text-gray-500">{problem}</p>}
      <SaveButton
        disabled={Boolean(problem)}
        isPending={isPending}
        onClick={() =>
          mutate(
            { id: settings.id, dailyBudget: budget, locationIds: locations.map((l) => l.id), startDate, endDate },
            { onSuccess: onClose },
          )
        }
      />
    </div>
  );
}

export function CampaignSettingsSheet({ campaignId, onClose }) {
  const { settings, isLoadingSettings, settingsError } = useOpenAICampaignSettings(campaignId);
  return (
    <SettingsSheet
      title="Campaign settings"
      isLoading={isLoadingSettings}
      settings={settings}
      error={settingsError}
      onClose={onClose}
    >
      <CampaignSettingsForm settings={settings} onClose={onClose} />
    </SettingsSheet>
  );
}

function BidModeTabs({ automatic, onChange, autoLabel }) {
  const options = [
    { value: false, label: 'Set my own bid' },
    { value: true, label: autoLabel },
  ];
  return (
    <div className="inline-flex p-0.5 bg-gray-100 rounded-xl">
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          onClick={() => onChange(option.value)}
          className={`px-3 py-1.5 text-xs font-medium rounded-[10px] transition ${
            automatic === option.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function AdGroupSettingsForm({ settings, campaignId, goal, currency, onClose }) {
  const [hints, setHints] = useState(settings.contextHints.join('\n'));
  const [automatic, setAutomatic] = useState(settings.bid == null);
  const [bid, setBid] = useState(settings.bid ?? '');
  const { mutate, isPending } = useUpdateOpenAIAdGroupSettings();
  const bidLabel = goal === 'sales' ? `Target cost per order (${currency})` : `Max cost per click (${currency})`;
  const autoLabel = goal === 'sales' ? 'Let OpenAI bid for orders' : 'Let OpenAI bid for clicks';
  const problem = !automatic && !(Number(bid) > 0) ? 'Set a bid, or let OpenAI bid for you' : null;

  return (
    <div className="space-y-4">
      <Field label="Who is this for?" hint="One whole idea per line. Commas inside a line are fine, so keep a list on one line.">
        <textarea rows={4} className={inputCls} value={hints} onChange={(e) => setHints(e.target.value)} />
      </Field>
      <Field label="Bidding">
        <BidModeTabs automatic={automatic} onChange={setAutomatic} autoLabel={autoLabel} />
      </Field>
      {automatic ? (
        <p className="text-xs text-gray-400">
          OpenAI sets each bid to win as many {goal === 'sales' ? 'orders' : 'clicks'} as it can inside the campaign daily budget.
          {settings.bid != null && ` Saving clears the current bid of ${fmtMoney(settings.bid, currency)}.`}
        </p>
      ) : (
        <Field label={bidLabel} hint={goal === 'sales' ? 'What you are happy to pay for one order.' : 'The most you will pay for one click.'}>
          <input type="number" min="0" step="0.5" className={inputCls} value={bid} onChange={(e) => setBid(e.target.value)} />
        </Field>
      )}
      {problem && <p className="text-sm text-gray-500">{problem}</p>}
      <SaveButton
        disabled={Boolean(problem)}
        isPending={isPending}
        onClick={() =>
          mutate(
            {
              id: settings.id,
              campaignId,
              contextHints: hints.split('\n').map((h) => h.trim()).filter(Boolean),
              ...(automatic ? { clearBid: true } : { bid: Number(bid) }),
            },
            { onSuccess: onClose },
          )
        }
      />
    </div>
  );
}

export function AdGroupSettingsSheet({ adGroupId, campaignId, goal, currency = 'AED', onClose }) {
  const { settings, isLoadingSettings, settingsError } = useOpenAIAdGroupSettings(adGroupId);
  return (
    <SettingsSheet
      title="Ad group settings"
      isLoading={isLoadingSettings}
      settings={settings}
      error={settingsError}
      onClose={onClose}
    >
      <AdGroupSettingsForm settings={settings} campaignId={campaignId} goal={goal} currency={currency} onClose={onClose} />
    </SettingsSheet>
  );
}
