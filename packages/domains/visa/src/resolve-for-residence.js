const has = (v) => v !== undefined && v !== null && v !== '';
const hasList = (v) => Array.isArray(v) && v.length > 0;

const SCALARS = [
  'metaTitle',
  'metaDescription',
  'heroHeadline',
  'heroSubheadline',
  'excerpt',
  'processingTime',
];

const WHOLE_LISTS = [
  'packages',
  'processSteps',
  'pricingBreakdown',
  'faqs',
  'testimonials',
  'whyUs',
];

export function resolveVisaForResidence(base, overlay) {
  if (!base) return null;

  const out = { ...base };
  const from = {};

  if (!overlay) {
    return { ...out, _resolved: { residence: null, overrides: [], isBaseOnly: true } };
  }

  for (const key of SCALARS) {
    if (has(overlay[key])) {
      out[key] = overlay[key];
      from[key] = 'overlay';
    }
  }

  for (const key of WHOLE_LISTS) {
    if (hasList(overlay[key])) {
      out[key] = overlay[key];
      from[key] = 'overlay';
    }
  }

  if (hasList(overlay.requirementSections)) {
    const bySectionTitle = new Map(
      (overlay.requirementSections || []).map((s) => [String(s.title).trim().toLowerCase(), s]),
    );
    const touched = [];

    out.requirementSections = (base.requirementSections || []).map((section) => {
      const patch = bySectionTitle.get(String(section.title).trim().toLowerCase());
      if (!patch) return section;
      bySectionTitle.delete(String(section.title).trim().toLowerCase());
      touched.push(section.title);
      return {
        ...section,
        ...(has(patch.intro) ? { intro: patch.intro } : {}),
        ...(hasList(patch.items) ? { items: patch.items } : {}),
      };
    });

    for (const leftover of bySectionTitle.values()) {
      out.requirementSections.push({
        title: leftover.title,
        intro: leftover.intro || '',
        items: leftover.items || [],
      });
      touched.push(leftover.title);
    }

    if (touched.length) from.requirementSections = touched;
  }

  if (overlay.visaCentre && has(overlay.visaCentre.name)) {
    out.visaCentre = overlay.visaCentre;
    from.visaCentre = 'overlay';
  }

  out.residence = overlay.residence;
  out.residenceName = overlay.residenceName;
  out.residenceSlug = overlay.residenceSlug;

  const overrides = Object.keys(from);
  return {
    ...out,
    _resolved: {
      residence: overlay.residence,
      overrides,
      isBaseOnly: overrides.length === 0,
      detail: from,
    },
  };
}

export default resolveVisaForResidence;
