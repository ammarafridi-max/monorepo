import { inclusiveDayCount, buildExpectedDates, isWithinRange } from './dates.js';

const norm = (s) => String(s ?? '').trim().toLowerCase();

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

export function validateItinerary(itineraryData, input) {
  const errors = [];
  const days = Array.isArray(itineraryData?.days) ? itineraryData.days : [];
  const { startDate, endDate, arrival, departure } = input;
  const expectedDayCount = inclusiveDayCount(startDate, endDate);
  const expectedDates = buildExpectedDates(startDate, expectedDayCount);

  if (days.length !== expectedDayCount) {
    errors.push(`Expected exactly ${expectedDayCount} day(s) for ${startDate}..${endDate}, but received ${days.length}.`);
  }

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

  if (days.length > 0) {
    const first = days[0];
    if (norm(first.city) !== norm(arrival.city)) {
      errors.push(`Day 1 city must be the arrival city "${arrival.city}", but got "${first.city}".`);
    }
    if (first.date !== startDate) {
      errors.push(`Day 1 must be dated ${startDate} (trip start).`);
    }
  }

  if (days.length > 0) {
    const last = days[days.length - 1];
    if (norm(last.city) !== norm(departure.city)) {
      errors.push(`The final day city must be the departure city "${departure.city}", but got "${last.city}".`);
    }
    if (last.date !== endDate) {
      errors.push(`The final day must be dated ${endDate} (trip end).`);
    }
  }

  // Deliberately no contiguity/order enforcement: a trip can legitimately revisit an earlier country.
  const allowedCountries = expectedCountryOrder(input);
  const allowedSet = new Set(allowedCountries);

  for (let i = 0; i < days.length; i += 1) {
    const c = norm(days[i]?.country);
    if (c && !allowedSet.has(c)) {
      errors.push(`Day ${i + 1} country "${days[i].country}" was not part of the requested trip.`);
    }
  }

  if (days.length > 0) {
    if (norm(days[0].country) !== norm(arrival.country)) {
      errors.push(`Day 1 must be in the arrival country "${arrival.country}".`);
    }
    if (norm(days[days.length - 1].country) !== norm(departure.country)) {
      errors.push(`The final day must be in the departure country "${departure.country}".`);
    }
  }

  const present = new Set(days.map((d) => norm(d?.country)).filter(Boolean));
  for (const c of input.otherCountries || []) {
    if (norm(c) && !present.has(norm(c))) {
      errors.push(`Requested country "${c}" does not appear in the itinerary.`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// Schengen members, normalized + aliases. EU-but-not-Schengen (Ireland, Cyprus) deliberately excluded.
const SCHENGEN_COUNTRIES = new Set([
  'austria', 'belgium', 'bulgaria', 'croatia', 'czechia', 'czech republic',
  'denmark', 'estonia', 'finland', 'france', 'germany', 'greece', 'hungary',
  'iceland', 'italy', 'latvia', 'liechtenstein', 'lithuania', 'luxembourg',
  'malta', 'netherlands', 'the netherlands', 'norway', 'poland', 'portugal',
  'romania', 'slovakia', 'slovenia', 'spain', 'sweden', 'switzerland',
]);

export const isSchengen = (country) => SCHENGEN_COUNTRIES.has(norm(country));

export function computeMainDestination(itineraryData, input) {
  const applyingTo = input?.visaCountry || '';
  const days = Array.isArray(itineraryData?.days) ? itineraryData.days : [];
  const result = { hasMismatch: false, applyingTo, mainDestination: null, nightsByCountry: {} };
  if (days.length < 2) return result;

  const order = [];
  const byKey = new Map();
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

  let mainKey = order[0];
  for (const key of order) {
    if (byKey.get(key).nights > byKey.get(mainKey).nights) mainKey = key;
  }
  result.mainDestination = byKey.get(mainKey).name;
  for (const { name, nights } of byKey.values()) result.nightsByCountry[name] = nights;

  const distinctSchengen = new Set(
    days.map((d) => norm(d?.country)).filter((c) => c && SCHENGEN_COUNTRIES.has(c)),
  );
  const inScope = SCHENGEN_COUNTRIES.has(norm(applyingTo)) && distinctSchengen.size >= 2;

  result.hasMismatch = inScope && mainKey !== norm(applyingTo);
  return result;
}

export function computeReturnHome(itineraryData, input) {
  const fromCountry = input?.fromCountry || '';
  // Derive from the current itineraryData, not input.segments: edits never touch segments, so a segment-based check goes stale.
  const days = Array.isArray(itineraryData?.days) ? itineraryData.days : [];
  const result = { hasMismatch: false, fromCountry, lastCountry: null };
  if (!fromCountry || days.length === 0) return result;

  const lastCountry = days[days.length - 1]?.country || '';
  result.lastCountry = lastCountry || null;
  result.hasMismatch = norm(lastCountry) !== norm(fromCountry);
  return result;
}
