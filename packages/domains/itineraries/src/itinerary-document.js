import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';

// Buildless ESM package → no JSX. `h` keeps the tree readable.
const h = React.createElement;

// -- Config / helpers (ported from the old HTML template) --------------------
const PURPOSE_PROFILES = {
  tourism: { label: 'Tourism' },
  business: { label: 'Business' },
  'family-visit': { label: 'Family Visit' },
  medical: { label: 'Medical' },
  study: { label: 'Study' },
  conference: { label: 'Conference' },
};

function titleCase(s) {
  return String(s ?? '').trim().replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function purposeProfile(purpose) {
  const key = String(purpose ?? '').trim().toLowerCase().replace(/\s+/g, '-');
  return PURPOSE_PROFILES[key] || { label: titleCase(purpose) };
}

function parseDate(dateStr) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function fmtLong(dateStr) {
  const d = parseDate(dateStr);
  return d ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : dateStr;
}

function fmtWeekday(dateStr) {
  const d = parseDate(dateStr);
  return d ? d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }).toUpperCase() : '';
}

function fmtDayNum(dateStr) {
  const d = parseDate(dateStr);
  return d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }) : '';
}

// Semantic colours for the activity-type pill: [background, text].
const BADGE_COLORS = {
  arrival: ['#eaf2fb', '#1d4ed8'],
  departure: ['#eef2f7', '#475569'],
  tourism: ['#ecfdf5', '#047857'],
  sightseeing: ['#ecfdf5', '#047857'],
  leisure: ['#ecfdf5', '#047857'],
  business: ['#fff8eb', '#b45309'],
  meeting: ['#fff8eb', '#b45309'],
  conference: ['#fff8eb', '#b45309'],
  work: ['#fff8eb', '#b45309'],
  transit: ['#eef2ff', '#4338ca'],
  travel: ['#eef2ff', '#4338ca'],
  medical: ['#fff1f2', '#be123c'],
  study: ['#f5f3ff', '#6d28d9'],
};

function dayType(day, index, total, purposeLabel) {
  if (day.type && String(day.type).trim()) return String(day.type).trim();
  if (index === 0) return 'Arrival';
  if (index === total - 1) return 'Departure';
  return purposeLabel || 'Activity';
}

function badgeColors(type) {
  const k = String(type ?? '').toLowerCase();
  for (const key of Object.keys(BADGE_COLORS)) {
    if (k.includes(key)) return BADGE_COLORS[key];
  }
  return ['#eef2f7', '#334155'];
}

function dayDescription(day) {
  if (day.description && String(day.description).trim()) return String(day.description).trim();
  if (Array.isArray(day.activities) && day.activities.length) return day.activities.join(' ');
  return '';
}

const DEFAULT_BRAND = {
  name: 'Travl',
  companyName: 'TRAVL Technologies',
  domain: 'travl.ae',
  primaryColor: '#0d6a66',
  accentColor: '#ff603a',
};

function buildStyles(b) {
  return StyleSheet.create({
    // 12mm ≈ 34pt vertical, 13mm ≈ 37pt horizontal.
    page: { paddingVertical: 34, paddingHorizontal: 37, fontFamily: 'Helvetica', fontSize: 9, color: '#0f172a' },

    head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    headLeft: { flexGrow: 1, paddingRight: 16 },
    kicker: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', letterSpacing: 1, color: b.primaryColor, textTransform: 'uppercase' },
    h1: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginTop: 3, marginBottom: 1, color: '#0f172a' },
    route: { fontSize: 9.5, color: '#64748b' },
    headRight: { flexDirection: 'row' },
    metaCol: { marginLeft: 18, alignItems: 'flex-end' },
    metaLabel: { fontSize: 6, fontFamily: 'Helvetica-Bold', letterSpacing: 0.7, color: '#94a3b8', textTransform: 'uppercase' },
    metaValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#0f172a', marginTop: 2, textAlign: 'right' },

    section: { marginTop: 16 },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    sectionTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', letterSpacing: 0.9, color: '#0f172a', textTransform: 'uppercase' },
    sectionRule: { flexGrow: 1, height: 1, backgroundColor: '#e2e8f0', marginLeft: 10 },

    table: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, overflow: 'hidden' },
    thead: { flexDirection: 'row', backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    th: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', letterSpacing: 0.6, color: '#94a3b8', textTransform: 'uppercase', paddingVertical: 5, paddingHorizontal: 10 },
    thDate: { width: 92 },

    row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    cDate: { width: 92, paddingVertical: 6, paddingHorizontal: 10 },
    wd: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', letterSpacing: 0.5, color: '#94a3b8' },
    md: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#0f172a', marginTop: 1 },
    badge: { alignSelf: 'flex-start', borderRadius: 999, paddingVertical: 2, paddingHorizontal: 5, marginTop: 5 },
    badgeText: { fontSize: 5.5, fontFamily: 'Helvetica-Bold', letterSpacing: 0.3 },
    cDetails: { flexGrow: 1, flexBasis: 0, paddingVertical: 6, paddingHorizontal: 10 },
    loc: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', letterSpacing: 0.3, color: b.primaryColor, textTransform: 'uppercase' },
    dBody: { fontSize: 9, color: '#334155', marginTop: 2, lineHeight: 1.4 },
    dTitle: { fontFamily: 'Helvetica-Bold', color: '#0f172a' },

    watermarkLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    watermarkText: { position: 'absolute', fontSize: 18, fontFamily: 'Helvetica-Bold', transform: 'rotate(-30deg)' },
  });
}

// Diagonal repeating watermark (preview only). A grid of low-opacity rotated
// labels covering the whole A4 page; `fixed` repeats it on every page.
function watermarkLayer(s, b) {
  const label = `${b.name.toUpperCase()} · PREVIEW ONLY`;
  const tiles = [];
  for (let y = -30; y < 870; y += 120) {
    for (let x = -50; x < 620; x += 205) {
      tiles.push(
        h(Text, {
          key: `${x}_${y}`,
          fixed: true,
          style: [s.watermarkText, { left: x, top: y, color: b.primaryColor, opacity: 0.09 }],
        }, label),
      );
    }
  }
  return h(View, { key: 'wm', fixed: true, style: s.watermarkLayer }, tiles);
}

/**
 * Builds the @react-pdf <Document> for an itinerary order.
 * @param {{ order: object, watermark?: boolean, brand?: object }} args
 * @returns {React.ReactElement}
 */
export function buildItineraryDocument({ order, watermark = false, brand = {} }) {
  const b = { ...DEFAULT_BRAND, ...brand };
  const s = buildStyles(b);
  const { input, itineraryData } = order;
  const profile = purposeProfile(input.purpose);
  const days = Array.isArray(itineraryData?.days) ? itineraryData.days : [];

  const route =
    input.arrival.city === input.departure.city
      ? `${input.arrival.city}, ${input.arrival.country}`
      : `${input.arrival.city} → ${input.departure.city}`;

  const rows = days.map((d, i) => {
    const type = dayType(d, i, days.length, profile.label);
    const [bg, fg] = badgeColors(type);
    const detail = dayDescription(d);
    return h(View, { key: i, wrap: false, style: s.row }, [
      h(View, { key: 'date', style: s.cDate }, [
        h(Text, { key: 'wd', style: s.wd }, fmtWeekday(d.date)),
        h(Text, { key: 'md', style: s.md }, fmtDayNum(d.date)),
        h(View, { key: 'b', style: [s.badge, { backgroundColor: bg }] },
          h(Text, { style: [s.badgeText, { color: fg }] }, String(type).toUpperCase())),
      ]),
      h(View, { key: 'det', style: s.cDetails }, [
        h(Text, { key: 'loc', style: s.loc }, `${d.city}, ${d.country}`),
        h(Text, { key: 'body', style: s.dBody }, [
          d.title ? h(Text, { key: 't', style: s.dTitle }, d.title) : null,
          d.title && detail ? ' — ' : '',
          detail || '',
        ]),
      ]),
    ]);
  });

  return h(
    Document,
    {},
    h(Page, { size: 'A4', style: s.page }, [
      watermark ? watermarkLayer(s, b) : null,
      h(View, { key: 'head', style: s.head }, [
        h(View, { key: 'l', style: s.headLeft }, [
          h(Text, { key: 'k', style: s.kicker }, `${b.name} · Travel Document`),
          h(Text, { key: 'h', style: s.h1 }, 'Travel Itinerary'),
          h(Text, { key: 'r', style: s.route }, route),
        ]),
        h(View, { key: 'r', style: s.headRight }, [
          h(View, { key: 'd', style: s.metaCol }, [
            h(Text, { key: 'l', style: s.metaLabel }, 'Travel Dates'),
            h(Text, { key: 'v', style: s.metaValue }, `${fmtLong(input.startDate)} – ${fmtLong(input.endDate)}`),
          ]),
          h(View, { key: 'p', style: s.metaCol }, [
            h(Text, { key: 'l', style: s.metaLabel }, 'Prepared For'),
            h(Text, { key: 'v', style: s.metaValue }, `${input.visaCountry} Visa`),
          ]),
        ]),
      ]),
      h(View, { key: 'sec', style: s.section }, [
        h(View, { key: 'st', style: s.sectionTitleRow }, [
          h(Text, { key: 't', style: s.sectionTitle }, 'Daily Schedule'),
          h(View, { key: 'rule', style: s.sectionRule }),
        ]),
        h(View, { key: 'table', style: s.table }, [
          h(View, { key: 'thead', style: s.thead }, [
            h(Text, { key: 'd', style: [s.th, s.thDate] }, 'Date'),
            h(Text, { key: 'i', style: s.th }, 'Itinerary Details'),
          ]),
          ...rows,
        ]),
      ]),
    ]),
  );
}
