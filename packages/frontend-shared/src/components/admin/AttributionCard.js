'use client';

import { Megaphone } from 'lucide-react';
import { describeChannel } from '../../utils/attribution';

const CLICK_IDS = [
  ['gclid', 'Google click ID'],
  ['gbraid', 'Google click ID (iOS)'],
  ['wbraid', 'Google click ID (web)'],
  ['fbclid', 'Meta click ID'],
  ['msclkid', 'Microsoft click ID'],
  ['ttclid', 'TikTok click ID'],
];

function fmtDatetime(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function Row({ label, value, mono }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-400 shrink-0">{label}</span>
      <span className={`text-sm font-semibold text-gray-800 text-right break-all ${mono ? 'font-mono text-xs' : ''}`}>
        {value}
      </span>
    </div>
  );
}

function Touch({ heading, touch }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-1">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{heading}</p>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border bg-primary-50 text-primary-700 border-primary-200">
          <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
          {describeChannel(touch)}
        </span>
      </div>
      <Row label="Source" value={touch.source} />
      <Row label="Medium" value={touch.medium} />
      <Row label="Campaign" value={touch.campaign} />
      <Row label="Term" value={touch.term} />
      <Row label="Content" value={touch.content} />
      {CLICK_IDS.map(([key, label]) => (
        <Row key={key} label={label} value={touch[key]} mono />
      ))}
      <Row label="Landing page" value={touch.landingPage} mono />
      <Row label="Referrer" value={touch.referrer} mono />
      <Row label="Captured" value={fmtDatetime(touch.capturedAt)} />
    </div>
  );
}

function sameTouch(a, b) {
  if (!a || !b) return false;
  return a.capturedAt === b.capturedAt && a.landingPage === b.landingPage;
}

export default function AttributionCard({ attribution }) {
  const { first, last } = attribution || {};

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100">
        <Megaphone size={14} className="text-gray-400 shrink-0" />
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Marketing Source</p>
      </div>
      <div className="p-5 space-y-5">
        {!first && !last ? (
          <p className="text-sm text-gray-400">Not recorded. Orders placed before source tracking went live have no source.</p>
        ) : sameTouch(first, last) || !last || !first ? (
          <Touch heading="Source" touch={last || first} />
        ) : (
          <>
            <Touch heading="Last visit (converted)" touch={last} />
            <Touch heading="First visit" touch={first} />
          </>
        )}
      </div>
    </div>
  );
}
