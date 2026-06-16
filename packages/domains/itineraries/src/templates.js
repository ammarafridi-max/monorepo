// There is no universal embassy template, so the purpose and country drive what
// the document emphasises. This is configuration, not a single hardcoded layout.
const PURPOSE_PROFILES = {
  tourism: { label: 'Tourism' },
  business: { label: 'Business' },
  'family-visit': { label: 'Family Visit' },
  medical: { label: 'Medical' },
  study: { label: 'Study' },
  conference: { label: 'Conference' },
};

function purposeProfile(purpose) {
  const key = String(purpose ?? '').trim().toLowerCase().replace(/\s+/g, '-');
  return PURPOSE_PROFILES[key] || { label: titleCase(purpose) };
}

function titleCase(s) {
  return String(s ?? '').trim().replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseDate(dateStr) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function fmtLong(dateStr) {
  const d = parseDate(dateStr);
  if (!d) return dateStr;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function fmtWeekday(dateStr) {
  const d = parseDate(dateStr);
  if (!d) return '';
  return d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }).toUpperCase();
}

function fmtDayNum(dateStr) {
  const d = parseDate(dateStr);
  if (!d) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
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

// 1–2 line summary for a day: prefer the model's `description`, fall back to
// joining legacy `activities` (older orders) into a single sentence.
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

// Repeating diagonal watermark, baked server-side as an SVG tile. Preview only.
function watermarkStyle(brand) {
  const text = `${brand.name.toUpperCase()} · PREVIEW ONLY`;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='440' height='300'><text x='0' y='170' transform='rotate(-30 0 170)' font-family='Arial, sans-serif' font-size='32' fill='${brand.primaryColor}' fill-opacity='0.09'>${text}</text></svg>`;
  const uri = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  return `.watermark{position:fixed;inset:0;z-index:9999;pointer-events:none;background-image:url("${uri}");background-repeat:repeat;}`;
}

/**
 * Builds the full HTML document for an itinerary order.
 * @param {{ order: object, watermark?: boolean, brand?: object }} args
 */
export function buildItineraryHtml({ order, watermark = false, brand = {} }) {
  const b = { ...DEFAULT_BRAND, ...brand };
  const { input, itineraryData } = order;
  const profile = purposeProfile(input.purpose);
  const days = Array.isArray(itineraryData?.days) ? itineraryData.days : [];

  const route =
    input.arrival.city === input.departure.city
      ? `${escapeHtml(input.arrival.city)}, ${escapeHtml(input.arrival.country)}`
      : `${escapeHtml(input.arrival.city)} → ${escapeHtml(input.departure.city)}`;

  const rowsHtml = days
    .map((d, i) => {
      const type = dayType(d, i, days.length, profile.label);
      const [bg, fg] = badgeColors(type);
      const detail = dayDescription(d);
      return `
        <tr>
          <td class="c-date">
            <div class="wd">${escapeHtml(fmtWeekday(d.date))}</div>
            <div class="md">${escapeHtml(fmtDayNum(d.date))}</div>
            <span class="badge" style="background:${bg};color:${fg}">${escapeHtml(type.toUpperCase())}</span>
          </td>
          <td class="c-details">
            <div class="loc">${escapeHtml(d.city)}, ${escapeHtml(d.country)}</div>
            <div class="d-body">${d.title ? `<span class="d-title">${escapeHtml(d.title)}</span>` : ''}${detail ? `${d.title ? ' — ' : ''}${escapeHtml(detail)}` : ''}</div>
          </td>
        </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  @page { size: A4; margin: 12mm 13mm; }
  body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; margin: 0; font-size: 11px; line-height: 1.4; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  /* The preview is a screenshot, which ignores @page margins — so pad the doc
     directly in that mode. The print PDF relies on the @page margin instead
     (correct per-page margins across multiple pages). */
  .doc { padding: ${watermark ? '12mm 13mm' : '0'}; }

  /* Header */
  .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; }
  .kicker { font-size: 9px; font-weight: 700; letter-spacing: .12em; color: ${b.primaryColor}; text-transform: uppercase; }
  h1 { font-size: 20px; font-weight: 800; letter-spacing: -0.02em; margin: 3px 0 1px; color: #0f172a; }
  .route { font-size: 11.5px; color: #64748b; font-weight: 500; }
  .head-right { display: flex; gap: 22px; text-align: right; }
  .meta-label { font-size: 8px; font-weight: 700; letter-spacing: .1em; color: #94a3b8; text-transform: uppercase; }
  .meta-value { font-size: 11px; font-weight: 600; color: #0f172a; margin-top: 2px; }

  /* Section heading with full-width rule */
  .section { margin-top: 14px; }
  .section-title { display: flex; align-items: center; gap: 10px; font-size: 10.5px; font-weight: 700; letter-spacing: .1em; color: #0f172a; text-transform: uppercase; margin: 0 0 8px; }
  .section-title::after { content: ""; flex: 1; height: 1px; background: #e2e8f0; }

  /* Daily schedule table */
  .schedule { width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; }
  .schedule thead th { background: #f8fafc; font-size: 8px; font-weight: 700; letter-spacing: .08em; color: #94a3b8; text-transform: uppercase; text-align: left; padding: 5px 10px; border-bottom: 1px solid #e2e8f0; }
  .schedule tbody td { padding: 6px 10px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
  .schedule tbody tr:last-child td { border-bottom: 0; }
  .schedule tbody tr { page-break-inside: avoid; }
  .c-date { width: 86px; }
  .c-date .wd { font-size: 8px; font-weight: 700; color: #94a3b8; letter-spacing: .06em; }
  .c-date .md { font-size: 11.5px; font-weight: 700; color: #0f172a; margin-top: 1px; }
  .c-date .badge { margin-top: 5px; }
  .badge { display: inline-block; font-size: 7.5px; font-weight: 800; letter-spacing: .04em; padding: 3px 7px; border-radius: 999px; white-space: nowrap; }
  .loc { font-size: 9px; font-weight: 700; color: ${b.primaryColor}; text-transform: uppercase; letter-spacing: .03em; }
  .d-body { font-size: 11px; color: #334155; margin-top: 2px; line-height: 1.4; }
  .d-title { font-weight: 700; color: #0f172a; }
  ${watermark ? watermarkStyle(b) : ''}
</style>
</head>
<body>
  ${watermark ? '<div class="watermark"></div>' : ''}
  <div class="doc">
    <div class="head">
      <div class="head-left">
        <div class="kicker">${escapeHtml(b.name)} · Travel Document</div>
        <h1>Travel Itinerary</h1>
        <div class="route">${route}</div>
      </div>
      <div class="head-right">
        <div>
          <div class="meta-label">Travel Dates</div>
          <div class="meta-value">${escapeHtml(fmtLong(input.startDate))} – ${escapeHtml(fmtLong(input.endDate))}</div>
        </div>
        <div>
          <div class="meta-label">Prepared For</div>
          <div class="meta-value">${escapeHtml(input.visaCountry)} Visa</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">Daily Schedule</h2>
      <table class="schedule">
        <thead><tr><th>Date</th><th>Itinerary Details</th></tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
  </div>
</body>
</html>`;
}
