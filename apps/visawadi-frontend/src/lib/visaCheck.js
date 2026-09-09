/**
 * Shared helpers for the /visa-check pages.
 *
 * Country names come from Intl.DisplayNames rather than a bundled list: the
 * rules store ISO codes only, and a hand-maintained name table would drift.
 * There is no demonym in Intl, so copy says "holders of a Pakistan passport"
 * rather than "Pakistani nationals" — accurate for every code, no lookup.
 */

import { COUNTRIES } from '@travel-suite/frontend-shared/data/countries';

const REGION_NAMES = new Intl.DisplayNames(['en'], { type: 'region' });

export const countryName = (code) => {
  const c = String(code || '').toUpperCase();
  if (!/^[A-Z]{2}$/.test(c)) return c;
  try {
    return REGION_NAMES.of(c) || c;
  } catch {
    return c;
  }
};

/** XS is the Schengen area, which Intl does not know about. */
const SPECIAL = { XS: 'Schengen Area' };
export const destinationLabel = (code, fallback) => SPECIAL[code] || fallback || countryName(code);

/**
 * Names that read with a definite article: "the United States", "the
 * Netherlands". Covers the recurring shapes rather than enumerating every
 * country, which would be another list to maintain.
 */
const TAKES_THE = /^(United|Republic|Democratic|Netherlands|Philippines|Bahamas|Maldives|Gambia|Comoros|Czech|Schengen)\b|Islands$/;
export const withArticle = (code) => {
  const n = destinationLabel(code);
  return TAKES_THE.test(n) ? `the ${n}` : n;
};

/**
 * "India passport holders" rather than "holders of a India passport": using the
 * country as a modifier sidesteps a/an agreement without needing a demonym
 * table, which Intl does not provide.
 */
export const passportPhrase = (code) => `${countryName(code)} passport holders`;

/**
 * Resolves one nationality against a rule the same way the checker's curated
 * provider does: a residence override wins over the outcome groups, and the
 * groups win over the rule's default.
 */
export function resolveForNationality(rule, nationality, residence) {
  const nat = String(nationality || '').toUpperCase();
  const res = String(residence || '').toUpperCase();
  if (!rule || !/^[A-Z]{2}$/.test(nat)) return null;

  if (res) {
    const override = (rule.residenceOverrides || []).find(
      (o) => o.residence === res && (o.nationalities || []).includes(nat),
    );
    if (override) {
      return {
        outcome: override.outcome,
        maxStayDays: override.maxStayDays ?? null,
        note: override.note || '',
        basis: 'residence',
      };
    }
  }

  const group = (rule.groups || []).find((g) => (g.nationalities || []).includes(nat));
  if (group) {
    return {
      outcome: group.outcome,
      maxStayDays: group.maxStayDays ?? null,
      note: group.note || '',
      basis: 'nationality',
    };
  }

  return { outcome: rule.defaultOutcome, maxStayDays: null, note: '', basis: 'default' };
}

/**
 * Every nationality, not only the ones the rule names. A rule lists exceptions
 * and leaves the rest to defaultOutcome, so a table built from the rule alone
 * answers for 93 of 239 passports on France and stays silent on the rest, which
 * is precisely the reader the page is for.
 *
 * Resolution order matches the checker: residence override, then outcome group,
 * then the rule's default.
 */
export function buildNationalityTable(rule, { residence } = {}) {
  const res = residence ? String(residence).toUpperCase() : null;

  const fromGroups = new Map();
  for (const group of rule.groups || []) {
    for (const code of group.nationalities || []) {
      if (!fromGroups.has(code)) {
        fromGroups.set(code, { outcome: group.outcome, maxStayDays: group.maxStayDays ?? null });
      }
    }
  }

  const fromOverride = new Map();
  if (res) {
    for (const o of rule.residenceOverrides || []) {
      if (o.residence !== res) continue;
      for (const code of o.nationalities || []) {
        fromOverride.set(code, { outcome: o.outcome, maxStayDays: o.maxStayDays ?? null });
      }
    }
  }

  return COUNTRIES
    // A destination is not a nationality for its own page.
    .filter((c) => c.code !== rule.destination)
    .map((c) => {
      const hit = fromOverride.get(c.code) || fromGroups.get(c.code);
      return {
        code: c.code,
        name: c.name,
        outcome: hit?.outcome ?? rule.defaultOutcome,
        maxStayDays: hit?.maxStayDays ?? null,
        overridden: fromOverride.has(c.code),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export const outcomeCounts = (rows) =>
  rows.reduce((acc, r) => ({ ...acc, [r.outcome]: (acc[r.outcome] || 0) + 1 }), {});

export const isoParam = (value) => {
  const v = String(value || '').toUpperCase().trim();
  return /^[A-Z]{2}$/.test(v) ? v : null;
};
