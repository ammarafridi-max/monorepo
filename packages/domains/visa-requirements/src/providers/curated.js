/**
 * Provider backed by our own curated rules.
 *
 * Every provider exposes the same shape:
 *   resolve({ nationality, residence, destination }) -> answer | null
 * Returning null means "I have nothing for this", which lets the service fall
 * through to the next provider. That is the seam a paid provider slots into
 * later without the tool or the frontend knowing anything changed.
 */

/**
 * Precedence, most specific first:
 *   1. residence override naming this nationality
 *   2. residence override for any nationality
 *   3. nationality listed in an outcome group
 *   4. the destination's default
 *
 * Residence wins because that is the whole reason it is asked for: a UAE
 * residence permit can turn a visa-required passport into visa-on-arrival, and
 * answering on nationality alone would be wrong in exactly the cases this
 * audience cares about.
 */
function resolveFromRule(rule, { nationality, residence }) {
  const nat = String(nationality || '').toUpperCase();
  const res = residence ? String(residence).toUpperCase() : null;

  if (res) {
    const overrides = (rule.residenceOverrides || []).filter((o) => o.residence === res);
    const specific = overrides.find((o) => (o.nationalities || []).includes(nat));
    const blanket = overrides.find((o) => !(o.nationalities || []).length);
    const hit = specific || blanket;
    if (hit) {
      return {
        outcome: hit.outcome,
        maxStayDays: hit.maxStayDays ?? null,
        note: hit.note || '',
        basis: 'residence',
        wasFallback: false,
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
      wasFallback: false,
    };
  }

  return {
    outcome: rule.defaultOutcome,
    maxStayDays: null,
    note: '',
    basis: 'default',
    // Flagged so the query log can surface which corridors have no real rule
    // yet. A default is a guess, and guesses should be visible.
    wasFallback: true,
  };
}

export function createCuratedProvider({ VisaRule }) {
  return {
    name: 'curated',

    async resolve({ nationality, residence, destination }) {
      const rule = await VisaRule.findOne({
        destination: String(destination || '').toUpperCase(),
        isPublished: true,
      }).lean();
      if (!rule) return null;

      const resolved = resolveFromRule(rule, { nationality, residence });

      return {
        ...resolved,
        source: 'curated',
        destination: rule.destination,
        destinationName: rule.destinationName,
        visaSlug: rule.visaSlug || null,
        officialSourceUrl: rule.officialSourceUrl || '',
        officialSourceName: rule.officialSourceName || '',
        lastVerifiedAt: rule.lastVerifiedAt || null,
        generalNotes: rule.generalNotes || '',
      };
    },
  };
}

export { resolveFromRule };
