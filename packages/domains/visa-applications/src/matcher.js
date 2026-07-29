// Pure rule matcher — NO database access, so it can be reasoned about and tested on
// its own. It answers three questions about a ChecklistTemplate given an applicant
// context:
//   1. does a rule apply?                 ruleMatches(when, ctx)
//   2. which documents does the applicant need?   evaluateTemplate(rules, ctx)
//   3. which profile questions must still be answered before we can seed?
//                                          neededProfileFields(rules, ctx)
//
// A context (ctx) is a plain object:
//   { ageGroup, employmentStatus, financialSupport, accommodationType,
//     minorTravellingWith, isPrimary }
// Any value may be null/undefined meaning "not yet known".

// Which profile field answers each rule condition. `isPrimary` is derived, not asked.
export const CONDITION_TO_FIELD = {
  ageGroup: 'dateOfBirth', // ageGroup is derived from dateOfBirth
  employmentStatus: 'employmentStatus',
  financialSupport: 'financialSupport',
  accommodationType: 'accommodationType',
  minorTravellingWith: 'minorTravellingWith',
};

const isKnown = (v) => v !== null && v !== undefined && v !== '';

// Derive ADULT/MINOR from a date of birth and the intended travel date. Under 18 at
// the travel date is MINOR. Returns null when the date of birth is unknown.
export function deriveAgeGroup(dateOfBirth, travelDate) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const at = travelDate ? new Date(travelDate) : new Date();
  let age = at.getFullYear() - dob.getFullYear();
  const m = at.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && at.getDate() < dob.getDate())) age -= 1;
  return age < 18 ? 'MINOR' : 'ADULT';
}

// Does a single condition value match the actual ctx value?
//  - array condition: actual must be one of the listed values (OR)
//  - boolean condition (isPrimary): strict equality
function conditionMatches(cond, actual) {
  if (Array.isArray(cond)) return isKnown(actual) && cond.includes(actual);
  if (typeof cond === 'boolean') return Boolean(actual) === cond;
  return true; // unrecognised condition shape → treat as no constraint
}

// A rule applies when EVERY present condition matches. An absent condition matches
// anything. If a present condition references a ctx value that is not yet known, the
// rule does NOT apply (we can't confirm it), which is the safe default.
export function ruleMatches(when = {}, ctx = {}) {
  for (const [key, cond] of Object.entries(when || {})) {
    if (cond === undefined || cond === null) continue; // absent condition
    if (Array.isArray(cond) && cond.length === 0) continue; // empty array → no constraint
    if (!conditionMatches(cond, ctx[key])) return false;
  }
  return true;
}

// The set of documentType keys the applicant needs, with the strictest optionality
// (a document required by any matching rule is required, even if another matching
// rule marks it optional).
export function evaluateTemplate(rules = [], ctx = {}) {
  const byKey = new Map();
  for (const rule of rules) {
    if (!ruleMatches(rule.when, ctx)) continue;
    const key = rule.documentTypeKey;
    const prev = byKey.get(key);
    const isOptional = prev ? prev.isOptional && Boolean(rule.isOptional) : Boolean(rule.isOptional);
    byKey.set(key, { documentTypeKey: key, isOptional });
  }
  return [...byKey.values()];
}

// A rule is "potentially applicable" when every ALREADY-KNOWN condition matches
// (unknown conditions don't disqualify it yet). For each such rule, any condition
// whose ctx value is still unknown is a question we must ask. Returns the list of
// profile FIELD names still needed (deduped; `isPrimary` is derived, never asked).
export function neededProfileFields(rules = [], ctx = {}) {
  const needed = new Set();
  for (const rule of rules) {
    let potential = true;
    for (const [key, cond] of Object.entries(rule.when || {})) {
      if (cond === undefined || cond === null) continue;
      if (Array.isArray(cond) && cond.length === 0) continue;
      if (key === 'isPrimary') {
        if (Boolean(ctx.isPrimary) !== Boolean(cond)) { potential = false; break; }
        continue;
      }
      if (isKnown(ctx[key]) && !conditionMatches(cond, ctx[key])) { potential = false; break; }
    }
    if (!potential) continue;
    for (const key of Object.keys(rule.when || {})) {
      if (key === 'isPrimary') continue; // derived
      const cond = rule.when[key];
      if (cond === undefined || cond === null) continue;
      if (Array.isArray(cond) && cond.length === 0) continue;
      if (!isKnown(ctx[key]) && CONDITION_TO_FIELD[key]) needed.add(CONDITION_TO_FIELD[key]);
    }
  }
  return [...needed];
}

// Does any active rule reference a given condition key at all? Used to decide whether
// to show the application-level accommodation question in the portal.
export function templateReferencesCondition(rules = [], conditionKey) {
  return rules.some((r) => {
    const cond = r.when?.[conditionKey];
    return cond !== undefined && cond !== null && !(Array.isArray(cond) && cond.length === 0);
  });
}
