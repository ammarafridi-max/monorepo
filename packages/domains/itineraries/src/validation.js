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
