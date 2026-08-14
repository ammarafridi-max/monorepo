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
