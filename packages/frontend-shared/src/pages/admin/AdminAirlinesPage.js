'use client';

import { useMemo, useRef, useState } from 'react';
import { CheckCheck, ExternalLink, Eye, EyeOff, Images, Search, Trash2, Upload, X } from 'lucide-react';
import PageLoader from '../../components/ui/v1/PageLoader';
import { TICKET_VALIDITIES } from '../../utils/ticketValidity';
import {
  useAdoptAirlineLogo,
  useAdoptHighConfidenceLogos,
  useAirlines,
  useDeleteAirlineLogo,
  useUpdateAirline,
  useUpdateAirlineLogo,
} from '../../hooks/flights/useAirlines';

const MAX_BYTES = 2 * 1024 * 1024;

function logoSrc(logo) {
  if (!logo) return '';
  if (/^https?:\/\//.test(logo)) return logo.replace(/^http:\/\//, 'https://');
  return `${process.env.NEXT_PUBLIC_BACKEND_URL}${logo}`;
}

function isVisible(airline) {
  return airline.isVisible !== false;
}

function validitiesOf(airline) {
  return Array.isArray(airline.ticketValidities) ? airline.ticketValidities : TICKET_VALIDITIES;
}

function candidatesOf(airline) {
  return Array.isArray(airline.logoCandidates) ? airline.logoCandidates : [];
}

const SOURCE_LABEL = {
  wikimedia: 'Wikidata linked',
  'wikimedia-search': 'Commons search',
  airlabs: 'AirLabs 70px',
};

const SOURCE_STYLE = {
  wikimedia: 'border-green-200 bg-green-50 text-green-700',
  'wikimedia-search': 'border-amber-200 bg-amber-50 text-amber-700',
  airlabs: 'border-gray-200 bg-gray-50 text-gray-500',
};

function CandidateCard({ candidate, onUse, isBusy }) {
  const source = SOURCE_LABEL[candidate.source] || candidate.source;
  const badge = SOURCE_STYLE[candidate.source] || SOURCE_STYLE.airlabs;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex h-24 items-center justify-center rounded-lg border border-gray-100 bg-white p-2">
          <img src={logoSrc(candidate.url)} alt="" className="max-h-20 max-w-full object-contain" />
        </div>
        <div className="flex h-24 items-center justify-center rounded-lg border border-gray-800 bg-gray-900 p-2">
          <img src={logoSrc(candidate.url)} alt="" className="max-h-20 max-w-full object-contain" />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge}`}>
          {source}
        </span>
        <span className="text-[11px] font-semibold text-gray-400">score {candidate.score}</span>
      </div>

      <p className="mt-1.5 truncate text-sm font-semibold text-gray-900" title={candidate.sourceLabel || ''}>
        {candidate.sourceLabel || 'Untitled'}
      </p>
      <p className="mt-0.5 text-[11px] text-gray-500">
        {candidate.width && candidate.height ? `${candidate.width}x${candidate.height}` : 'size unknown'}
        {candidate.mime ? ` · ${candidate.mime.replace('image/', '')}` : ''}
        {candidate.licence ? ` · ${candidate.licence}` : ' · licence unknown'}
      </p>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          disabled={isBusy}
          onClick={() => onUse(candidate.url)}
          className="flex-1 rounded-lg bg-primary-700 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-primary-800 disabled:opacity-50"
        >
          Use this
        </button>
        {candidate.sourcePage && (
          <a
            href={candidate.sourcePage}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:border-gray-300"
          >
            <ExternalLink size={12} />
            Source
          </a>
        )}
      </div>
    </div>
  );
}

function BulkApproveDialog({ plan, onClose, onConfirm, isBusy }) {
  const rows = plan?.pending || [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-gray-900/50 p-4 sm:p-8">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
          <div>
            <h3 className="text-lg font-extrabold text-gray-900">
              Approve {rows.length} high-confidence logo{rows.length === 1 ? '' : 's'}
            </h3>
            <p className="mt-0.5 text-sm text-gray-500">
              Only Wikidata-linked matches scoring {plan?.threshold ?? 100} or more. Everything weaker, including every
              70px fallback, stays for manual review.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:border-gray-300"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto px-5 py-3">
          {rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              Nothing meets the bar right now. Approve the rest from each airline&apos;s candidate list.
            </p>
          ) : (
            <table className="w-full border-collapse text-left text-sm">
              <tbody>
                {rows.map((row) => (
                  <tr key={row.iataCode} className="border-b border-gray-50 last:border-0">
                    <td className="py-2 pr-3 font-mono text-xs font-bold text-gray-900">{row.iataCode}</td>
                    <td className="py-2 pr-3 text-gray-700">{row.name}</td>
                    <td className="py-2 pr-3 text-gray-500">{row.label}</td>
                    <td className="py-2 pr-3 text-right text-xs text-gray-400">
                      {row.width && row.height ? `${row.width}x${row.height}` : ''}
                    </td>
                    <td className="py-2 text-right text-xs font-semibold text-gray-400">{row.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:border-gray-300"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isBusy || rows.length === 0}
            onClick={onConfirm}
            className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-800 disabled:opacity-50"
          >
            {isBusy ? 'Saving…' : `Approve ${rows.length}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function CandidateReview({ airline, onClose, onUse, isBusy }) {
  const candidates = candidatesOf(airline);
  const current = logoSrc(airline.logo);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-gray-900/50 p-4 sm:p-8">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
          <div>
            <h3 className="text-lg font-extrabold text-gray-900">
              {airline.commonName || airline.businessName || airline.iataCode}
              <span className="ml-2 font-mono text-sm font-semibold text-gray-400">{airline.iataCode}</span>
            </h3>
            <p className="mt-0.5 text-sm text-gray-500">
              {candidates.length} candidate{candidates.length === 1 ? '' : 's'}, best match first. Check it is the
              right carrier and not a cargo or regional arm before you use it.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:border-gray-300"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4">
          {current && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="flex h-12 w-20 items-center justify-center rounded border border-gray-200 bg-white">
                <img src={current} alt="" className="max-h-10 max-w-16 object-contain" />
              </div>
              <p className="text-sm text-gray-600">This is the logo in use now. Picking another replaces it.</p>
            </div>
          )}

          {candidates.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              No candidates were found for this airline. Upload one by hand instead.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {candidates.map((candidate) => (
                <CandidateCard
                  key={candidate.url}
                  candidate={candidate}
                  onUse={(url) => onUse({ iataCode: airline.iataCode, url })}
                  isBusy={isBusy}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AirlineRow({ airline, onUpload, onRemove, onUpdate, onReview, isBusy }) {
  const inputRef = useRef(null);
  const src = logoSrc(airline.logo);
  const visible = isVisible(airline);
  const validities = validitiesOf(airline);
  const candidates = candidatesOf(airline);

  function handleFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > MAX_BYTES) {
      onUpload({ error: 'That image is over 2 MB. Please use a smaller file.' });
      return;
    }
    onUpload({ iataCode: airline.iataCode, file });
  }

  function toggleValidity(validity) {
    const next = validities.includes(validity)
      ? validities.filter((value) => value !== validity)
      : [...validities, validity];
    onUpdate({ iataCode: airline.iataCode, ticketValidities: next });
  }

  return (
    <tr className={`border-t border-gray-100 ${visible ? '' : 'bg-gray-50/60'}`}>
      <td className="px-4 py-3">
        <div className="flex h-10 w-14 items-center justify-center rounded border border-gray-200 bg-gray-50">
          {src ? (
            <img src={src} alt={airline.commonName || airline.iataCode} className="max-h-8 max-w-12 object-contain" />
          ) : (
            <span className="text-[10px] font-medium text-gray-400">None</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 font-mono text-sm font-semibold text-gray-900">{airline.iataCode}</td>
      <td className="px-4 py-3 text-sm text-gray-700">
        {airline.commonName || airline.businessName || '—'}
      </td>
      <td className="px-4 py-3">
        <button
          type="button"
          disabled={isBusy}
          onClick={() => onUpdate({ iataCode: airline.iataCode, isVisible: !visible })}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
            visible
              ? 'border-green-200 bg-green-50 text-green-700 hover:border-green-300'
              : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
          }`}
        >
          {visible ? <Eye size={13} /> : <EyeOff size={13} />}
          {visible ? 'Shown' : 'Hidden'}
        </button>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {TICKET_VALIDITIES.map((validity) => {
            const on = validities.includes(validity);
            return (
              <button
                key={validity}
                type="button"
                disabled={isBusy}
                onClick={() => toggleValidity(validity)}
                aria-pressed={on}
                className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${
                  on
                    ? 'border-primary-300 bg-primary-50 text-primary-700'
                    : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300'
                }`}
              >
                {validity}
              </button>
            );
          })}
        </div>
        {validities.length === 0 && (
          <p className="mt-1 text-[11px] font-medium text-amber-600">No validity on sale, so this airline never shows.</p>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFile} />
          {candidates.length > 0 && (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => onReview(airline.iataCode)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 transition-colors hover:border-primary-300 disabled:opacity-50"
            >
              <Images size={13} />
              {candidates.length} found
            </button>
          )}
          <button
            type="button"
            disabled={isBusy}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:border-primary-300 hover:text-primary-700 disabled:opacity-50"
          >
            <Upload size={13} />
            {airline.logo ? 'Replace' : 'Upload'}
          </button>
          {airline.logo && (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => onRemove(airline.iataCode)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 transition-colors hover:border-red-300 hover:text-red-600 disabled:opacity-50"
            >
              <Trash2 size={13} />
              Remove
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function AdminAirlinesPage({
  heading = 'Airlines',
  description = 'Hide an airline to drop it from flight search results, and pick which dummy ticket validity periods it can be sold with. Logos are shown in search results; upload a square PNG under 2 MB.',
}) {
  const { airlines, isLoadingAirlines, isErrorAirlines, airlinesError } = useAirlines();
  const { updateAirline, isUpdatingAirline } = useUpdateAirline();
  const { adoptAirlineLogo, isAdoptingAirlineLogo } = useAdoptAirlineLogo();
  const { adoptHighConfidenceLogos, isAdoptingHighConfidence } = useAdoptHighConfidenceLogos();
  const { updateAirlineLogo, isUpdatingAirlineLogo } = useUpdateAirlineLogo();
  const { deleteAirlineLogo, isDeletingAirlineLogo } = useDeleteAirlineLogo();
  const [query, setQuery] = useState('');
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [onlyHidden, setOnlyHidden] = useState(false);
  const [onlyCandidates, setOnlyCandidates] = useState(false);
  const [reviewCode, setReviewCode] = useState(null);
  const [bulkPlan, setBulkPlan] = useState(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [error, setError] = useState('');

  const isBusy =
    isUpdatingAirline ||
    isAdoptingAirlineLogo ||
    isAdoptingHighConfidence ||
    isUpdatingAirlineLogo ||
    isDeletingAirlineLogo;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return airlines.filter((a) => {
      if (onlyMissing && a.logo) return false;
      if (onlyHidden && isVisible(a)) return false;
      if (onlyCandidates && candidatesOf(a).length === 0) return false;
      if (!needle) return true;
      return (
        a.iataCode?.toLowerCase().includes(needle) ||
        a.commonName?.toLowerCase().includes(needle) ||
        a.businessName?.toLowerCase().includes(needle)
      );
    });
  }, [airlines, query, onlyMissing, onlyHidden, onlyCandidates]);

  const missingCount = useMemo(() => airlines.filter((a) => !a.logo).length, [airlines]);
  const hiddenCount = useMemo(() => airlines.filter((a) => !isVisible(a)).length, [airlines]);
  const candidateCount = useMemo(
    () => airlines.filter((a) => !a.logo && candidatesOf(a).length > 0).length,
    [airlines],
  );
  const reviewAirline = useMemo(
    () => airlines.find((a) => a.iataCode === reviewCode) || null,
    [airlines, reviewCode],
  );

  async function openBulkApprove() {
    setError('');
    setIsPlanning(true);
    try {
      const plan = await adoptHighConfidenceLogos({ dryRun: true });
      setBulkPlan(plan);
    } catch {
      setError('Could not work out which logos are safe to approve. Please try again.');
    } finally {
      setIsPlanning(false);
    }
  }

  async function confirmBulkApprove() {
    try {
      await adoptHighConfidenceLogos({ dryRun: false });
    } finally {
      setBulkPlan(null);
    }
  }

  function handleUpload(payload) {
    if (payload.error) {
      setError(payload.error);
      return;
    }
    setError('');
    updateAirlineLogo(payload);
  }

  if (isLoadingAirlines) return <PageLoader />;

  if (isErrorAirlines) {
    return (
      <p className="mt-6 rounded-lg bg-white p-6 text-sm text-gray-700 shadow">
        {airlinesError?.message || 'Could not load airlines'}
      </p>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">{heading}</h2>
          <p className="mt-0.5 max-w-2xl text-sm text-gray-500">{description}</p>
        </div>
        <p className="shrink-0 text-right text-sm text-gray-500">
          {airlines.length} airlines, {hiddenCount} hidden, {missingCount} without a logo
          {candidateCount > 0 && (
            <>
              <br />
              <span className="font-semibold text-primary-700">{candidateCount} awaiting logo review</span>
            </>
          )}
        </p>
      </div>

      {candidateCount > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-primary-100 bg-primary-50/60 px-4 py-3">
          <CheckCheck size={18} className="text-primary-700" />
          <p className="flex-1 text-sm text-gray-700">
            Approve every Wikidata-linked match that scores 100 or more in one go. Weaker matches and all 70px
            fallbacks stay for you to review.
          </p>
          <button
            type="button"
            disabled={isBusy || isPlanning}
            onClick={openBulkApprove}
            className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-800 disabled:opacity-50"
          >
            {isPlanning ? 'Checking…' : 'Approve high-confidence'}
          </button>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by code or name"
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-primary-400 focus:outline-none"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={onlyHidden}
            onChange={(e) => setOnlyHidden(e.target.checked)}
            className="rounded border-gray-300"
          />
          Only hidden
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={onlyMissing}
            onChange={(e) => setOnlyMissing(e.target.checked)}
            className="rounded border-gray-300"
          />
          Only missing a logo
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={onlyCandidates}
            onChange={(e) => setOnlyCandidates(e.target.checked)}
            className="rounded border-gray-300"
          />
          Only with candidates
        </label>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-gray-50">
              <th scope="col" className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Logo</th>
              <th scope="col" className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Code</th>
              <th scope="col" className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Airline</th>
              <th scope="col" className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Visibility</th>
              <th scope="col" className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Ticket Validity</th>
              <th scope="col" className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((airline) => (
              <AirlineRow
                key={airline.iataCode}
                airline={airline}
                onUpload={handleUpload}
                onRemove={deleteAirlineLogo}
                onUpdate={updateAirline}
                onReview={setReviewCode}
                isBusy={isBusy}
              />
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-gray-500">No airlines match that search.</p>
        )}
      </div>

      {bulkPlan && (
        <BulkApproveDialog
          plan={bulkPlan}
          onClose={() => setBulkPlan(null)}
          onConfirm={confirmBulkApprove}
          isBusy={isAdoptingHighConfidence}
        />
      )}

      {reviewAirline && (
        <CandidateReview
          airline={reviewAirline}
          onClose={() => setReviewCode(null)}
          onUse={adoptAirlineLogo}
          isBusy={isBusy}
        />
      )}
    </div>
  );
}
