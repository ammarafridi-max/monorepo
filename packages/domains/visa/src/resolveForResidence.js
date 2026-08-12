/**
 * Lay a residence overlay over a base visa page.
 *
 * MERGE RULES, and why each one is what it is:
 *
 *  Scalars (metaTitle, heroHeadline, processingTime…)
 *      Overlay wins when it has a value. Empty string and null count as "no
 *      value" — an admin clearing a field means "inherit", not "blank the page".
 *
 *  Lists (packages, processSteps, pricingBreakdown, faqs, testimonials)
 *      Whole-list replacement. Merging item by item needs rules for ordering,
 *      for removing a base item that doesn't apply locally, and for what
 *      happens when the base list changes underneath. Every one of those is a
 *      way to produce a page nobody can explain. Replacement means each list
 *      has exactly one owner and you can always answer "where did this line
 *      come from".
 *
 *  requirementSections
 *      The one exception, matched by title. A requirements checklist is
 *      usually mostly shared with two or three local lines, so replacing the
 *      whole thing would mean restating universal items in every country.
 *      Sections the overlay doesn't name are inherited untouched.
 *
 *  visaCentre
 *      Overlay only. There is no sensible universal default for "which office
 *      do I walk into".
 */

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

/**
 * @param {object} base     a Visa document (plain object)
 * @param {object} [overlay] a VisaOverlay document, or null for the base as-is
 * @returns {object} the resolved page, plus `_resolved` describing where each
 *          overridden field came from — used by the admin to show what a
 *          country actually owns, and to flag an overlay that changes nothing.
 */
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

    // A section the overlay names that the base doesn't have is local-only —
    // append it rather than dropping it silently.
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
      // An overlay that overrides nothing produces a page identical to every
      // other country's — which is exactly the thin duplicate to avoid. Worth
      // surfacing rather than letting it ship quietly.
      isBaseOnly: overrides.length === 0,
      detail: from,
    },
  };
}

export default resolveVisaForResidence;
