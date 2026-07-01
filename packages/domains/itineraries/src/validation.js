import { inclusiveDayCount, buildExpectedDates, isWithinRange } from './dates.js';

const norm = (s) => String(s ?? '').trim().toLowerCase();

/** Ordered list of unique countries the trip should pass through. */
export function expectedCountryOrder(input) {
  const seq = [input.arrival.country, ...(input.otherCountries || []), input.departure.country];
  const seen = new Set();
  const out = [];
  for (const c of seq) {
    const key = norm(c);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

/**
 * Validates AI-generated itinerary content against the customer's input.
 * Code — not the model — owns these invariants. Returns a list of human-readable
 * errors (empty when valid); the caller feeds them back for the single
 * auto-regeneration, then surfaces an error rather than shipping a bad document.
 *
 * @param {object} itineraryData  { summary, days }
 * @param {object} input          order.input
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateItinerary(itineraryData, input) {
  const errors = [];
  const days = Array.isArray(itineraryData?.days) ? itineraryData.days : [];
  const { startDate, endDate, arrival, departure } = input;
  const expectedDayCount = inclusiveDayCount(startDate, endDate);
  const expectedDates = buildExpectedDates(startDate, expectedDayCount);

  // -- Rule: day count equals trip length ------------------------------------
  if (days.length !== expectedDayCount) {
    errors.push(`Expected exactly ${expectedDayCount} day(s) for ${startDate}..${endDate}, but received ${days.length}.`);
  }

  // -- Per-day shape + every date inside the window, sequential --------------
  days.forEach((d, i) => {
    if (!d || typeof d !== 'object') {
      errors.push(`Day ${i + 1} is malformed.`);
      return;
    }
    if (!d.city || !d.country) {
      errors.push(`Day ${i + 1} is missing a city or country.`);
    }
    if (!d.date || !isWithinRange(d.date, startDate, endDate)) {
      errors.push(`Day ${i + 1} date "${d.date}" is outside the trip window ${startDate}..${endDate}.`);
    }
    const expectedDate = expectedDates[i];
    if (expectedDate && d.date !== expectedDate) {
      errors.push(`Day ${i + 1} should be dated ${expectedDate}, not "${d.date}". Days must be sequential with no gaps or repeats.`);
    }
  });

  // -- Rule: first day city equals arrival city ------------------------------
  if (days.length > 0) {
    const first = days[0];
    if (norm(first.city) !== norm(arrival.city)) {
      errors.push(`Day 1 city must be the arrival city "${arrival.city}", but got "${first.city}".`);
    }
    if (first.date !== startDate) {
      errors.push(`Day 1 must be dated ${startDate} (trip start).`);
    }
  }

  // -- Rule: last day city equals departure city -----------------------------
  if (days.length > 0) {
    const last = days[days.length - 1];
    if (norm(last.city) !== norm(departure.city)) {
      errors.push(`The final day city must be the departure city "${departure.city}", but got "${last.city}".`);
    }
    if (last.date !== endDate) {
      errors.push(`The final day must be dated ${endDate} (trip end).`);
    }
  }

  // -- Rule: countries are consistent with the requested trip -----------------
  // We validate membership and the arrival/departure anchors. We deliberately do
  // NOT enforce strict contiguity or a single canonical order: a legitimate trip
  // can end in a country visited earlier (e.g. fly home from Munich after
  // Austria), and the user-provided country list is a guide, not a guaranteed
  // sequence. Over-enforcing those produced false rejections.
  const allowedCountries = expectedCountryOrder(input); // unique, normalized
  const allowedSet = new Set(allowedCountries);

  // No country outside the declared set (no invented destinations).
  for (let i = 0; i < days.length; i += 1) {
    const c = norm(days[i]?.country);
    if (c && !allowedSet.has(c)) {
      errors.push(`Day ${i + 1} country "${days[i].country}" was not part of the requested trip.`);
    }
  }

  // Arrival / departure country anchors.
  if (days.length > 0) {
    if (norm(days[0].country) !== norm(arrival.country)) {
      errors.push(`Day 1 must be in the arrival country "${arrival.country}".`);
    }
    if (norm(days[days.length - 1].country) !== norm(departure.country)) {
      errors.push(`The final day must be in the departure country "${departure.country}".`);
    }
  }

  // Every explicitly requested country should appear somewhere in the plan.
  const present = new Set(days.map((d) => norm(d?.country)).filter(Boolean));
  for (const c of input.otherCountries || []) {
    if (norm(c) && !present.has(norm(c))) {
      errors.push(`Requested country "${c}" does not appear in the itinerary.`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// Schengen Area members (29 as of 2025), normalized + common aliases. Includes
// Croatia (2023) and the now-full members Bulgaria and Romania (2024-2025).
// EU members NOT in Schengen (Ireland, Cyprus) are intentionally excluded.
const SCHENGEN_COUNTRIES = new Set([
  'austria', 'belgium', 'bulgaria', 'croatia', 'czechia', 'czech republic',
  'denmark', 'estonia', 'finland', 'france', 'germany', 'greece', 'hungary',
  'iceland', 'italy', 'latvia', 'liechtenstein', 'lithuania', 'luxembourg',
  'malta', 'netherlands', 'the netherlands', 'norway', 'poland', 'portugal',
  'romania', 'slovakia', 'slovenia', 'spain', 'sweden', 'switzerland',
]);

export const isSchengen = (country) => SCHENGEN_COUNTRIES.has(norm(country));

/**
 * Advisory main-destination check (NOT a hard block). Counts overnight nights
 * per country from the generated day-by-day — the final departure day has no
 * overnight, so it is excluded — and picks the country with the most nights
 * (tie-break: the first-entry / arrival country). A mismatch is flagged only
 * when the applying-to country is Schengen AND the trip spans 2+ Schengen
 * countries; single-country trips and non-Schengen embassies are skipped. The
 * Schengen "purpose" exception (a conference/medical/family visit can be the
 * main destination regardless of nights) can't be detected here, so this only
 * advises — the customer can always proceed.
 *
 * @returns {{ hasMismatch: boolean, applyingTo: string, mainDestination: string|null, nightsByCountry: Record<string, number> }}
 */
export function computeMainDestination(itineraryData, input) {
  const applyingTo = input?.visaCountry || '';
  const days = Array.isArray(itineraryData?.days) ? itineraryData.days : [];
  const result = { hasMismatch: false, applyingTo, mainDestination: null, nightsByCountry: {} };
  if (days.length < 2) return result;

  // Overnight nights per country — every day except the final (departure) day.
  const order = []; // first-entry order of countries (normalized keys)
  const byKey = new Map(); // key -> { name, nights }
  for (let i = 0; i < days.length - 1; i += 1) {
    const country = days[i]?.country;
    const key = norm(country);
    if (!key) continue;
    if (!byKey.has(key)) {
      byKey.set(key, { name: country, nights: 0 });
      order.push(key);
    }
    byKey.get(key).nights += 1;
  }
  if (byKey.size === 0) return result;

  // Main destination: most nights; on a tie, the earliest first-entry country.
  let mainKey = order[0];
  for (const key of order) {
    if (byKey.get(key).nights > byKey.get(mainKey).nights) mainKey = key;
  }
  result.mainDestination = byKey.get(mainKey).name;
  for (const { name, nights } of byKey.values()) result.nightsByCountry[name] = nights;

  // Scope: only advise for Schengen embassies on multi-Schengen-country trips.
  const distinctSchengen = new Set(
    days.map((d) => norm(d?.country)).filter((c) => c && SCHENGEN_COUNTRIES.has(c)),
  );
  const inScope = SCHENGEN_COUNTRIES.has(norm(applyingTo)) && distinctSchengen.size >= 2;

  result.hasMismatch = inScope && mainKey !== norm(applyingTo);
  return result;
}

/**
 * Advisory return-trip check (NOT a hard block). Flags when the trip does not
 * end back in the customer's home country — i.e. the last segment's destination
 * country differs from input.fromCountry, so no flight home is booked, which
 * embassies usually expect to see. Mirrors computeMainDestination's plumbing:
 * recomputed on every mutation, surfaced in buildMeta, non-blocking. Skipped when
 * there are no segments or no home country, and never flagged when the last
 * segment already returns to fromCountry.
 *
 * @returns {{ hasMismatch: boolean, fromCountry: string, lastCountry: string|null }}
 */
export function computeReturnHome(itineraryData, input) {
  const fromCountry = input?.fromCountry || '';
  // Derive from the CURRENT generated itinerary, not input.segments: chat/paid
  // edits update itineraryData (finalizeItinerary re-renders it) but never touch
  // segments (mergeTripEdit preserves them), so a segment-based check goes stale
  // after an edit and its one-click fix could never clear. Reading the last day's
  // country means the "Add a return flight" fix — which makes the AI end the
  // day-by-day back home — recomputes to hasMismatch:false and clears the banner.
  const days = Array.isArray(itineraryData?.days) ? itineraryData.days : [];
  const result = { hasMismatch: false, fromCountry, lastCountry: null };
  if (!fromCountry || days.length === 0) return result;

  const lastCountry = days[days.length - 1]?.country || '';
  result.lastCountry = lastCountry || null;
  result.hasMismatch = norm(lastCountry) !== norm(fromCountry);
  return result;
}
