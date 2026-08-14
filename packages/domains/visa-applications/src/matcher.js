export const CONDITION_TO_FIELD = {
  ageGroup: 'dateOfBirth',
  employmentStatus: 'employmentStatus',
  financialSupport: 'financialSupport',
  accommodationType: 'accommodationType',
  minorTravellingWith: 'minorTravellingWith',
};

const isKnown = (v) => v !== null && v !== undefined && v !== '';

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

function conditionMatches(cond, actual) {
  if (Array.isArray(cond)) return isKnown(actual) && cond.includes(actual);
  if (typeof cond === 'boolean') return Boolean(actual) === cond;
  return true;
}

export function ruleMatches(when = {}, ctx = {}) {
  for (const [key, cond] of Object.entries(when || {})) {
    if (cond === undefined || cond === null) continue;
    if (Array.isArray(cond) && cond.length === 0) continue;
    if (!conditionMatches(cond, ctx[key])) return false;
  }
  return true;
}

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
      if (key === 'isPrimary') continue;
      const cond = rule.when[key];
      if (cond === undefined || cond === null) continue;
      if (Array.isArray(cond) && cond.length === 0) continue;
      if (!isKnown(ctx[key]) && CONDITION_TO_FIELD[key]) needed.add(CONDITION_TO_FIELD[key]);
    }
  }
  return [...needed];
}

export function templateReferencesCondition(rules = [], conditionKey) {
  return rules.some((r) => {
    const cond = r.when?.[conditionKey];
    return cond !== undefined && cond !== null && !(Array.isArray(cond) && cond.length === 0);
  });
}
