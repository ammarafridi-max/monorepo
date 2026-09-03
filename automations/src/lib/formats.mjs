/**
 * Post formats, from the 2026 research on what AI engines actually cite:
 * verdict-first answers, structured tables, question-shaped headings, short
 * paragraphs, and attributed facts. Brand-neutral — a brand maps its length
 * tiers onto these.
 *
 * Sources behind these choices are recorded in docs/blog-format-research.md.
 */

export const FORMATS = {
  "quick-answer": {
    name: "Quick Answer",
    wordRange: "700–1000 words",
    maxTokens: 4000,
    minWords: 600,
    faqCount: 4,
    minCitations: 2,
    requiresFieldData: false,
    skeleton: `1. An answer paragraph of 40–80 words. Verdict in the first sentence. No preamble, no throat-clearing.
2. An "At a glance" HTML <table> of 4–6 hard facts (fee, timeline, where to file, validity). Every figure in it must be attributed to an official source.
3. Three or four <h2> headings, each phrased as a question a real applicant would type. Two or three short paragraphs under each.
4. A "Sources" section: a <ul> of the official pages you used, each as a link with the publisher named.`,
  },

  "sourced-guide": {
    name: "Sourced Guide",
    wordRange: "1400–2500 words",
    maxTokens: 6500,
    minWords: 1200,
    faqCount: 5,
    // Three, not four. Some destinations have only two approved domains
    // (Spain: blsinternational.com and exteriores.gob.es), and demanding a
    // fourth pushed the model into inventing deep links that 404.
    minCitations: 3,
    requiresFieldData: false,
    skeleton: `1. An answer paragraph of 40–80 words. Verdict in the first sentence.
2. An "At a glance" HTML <table> of 5–7 hard facts. Every figure attributed to an official source.
3. A "What you need" checklist as a <ul>, one line per document.
4. Four to seven <h2> headings, each phrased as a question a real applicant would type, walking through the process in order. Link the official source inline at the point each rule or figure is stated.
5. A section on why applications like this get refused, with the specific avoidable causes.
6. A costs <table> separating the service fee from embassy and visa-centre fees.
7. A "Sources" section: a <ul> of the official pages you used, each as a link with the publisher named.`,
  },

  "field-report": {
    name: "Field Report",
    wordRange: "2000–3500 words",
    maxTokens: 8000,
    minWords: 1800,
    faqCount: 5,
    minCitations: 5,
    /** Blocks generation unless the brand supplies real first-party numbers. */
    requiresFieldData: true,
    skeleton: `1. An answer paragraph of 40–80 words. Verdict in the first sentence.
2. A first-party data block introduced by an <h2>, reporting ONLY the figures supplied to you under "Our Own Data" below. Never estimate, round, or extrapolate beyond them, and never invent a sample size.
3. An "At a glance" HTML <table> of 5–7 hard facts, each attributed to an official source.
4. A "What you need" checklist as a <ul>.
5. Five to eight <h2> headings, each phrased as a question a real applicant would type, with the official source linked inline at each rule or figure.
6. A section on why applications like this get refused, tied back to the first-party data where it supports the point.
7. A costs <table> separating the service fee from embassy and visa-centre fees.
8. A "Sources" section: a <ul> of the official pages you used, each as a link with the publisher named.`,
  },
};

/**
 * Resolve the format a brand uses for a length tier, or null when the brand has
 * not opted in. A brand without formatsByTier keeps its original prompt, with
 * no format skeleton, no sourcing rules and no fact-check pass.
 */
export function resolveFormat(brand, lengthTier) {
  if (!brand.formatsByTier) return null;
  const key = brand.formatsByTier[lengthTier];
  const format = FORMATS[key];
  if (!format) {
    throw new Error(
      `Brand "${brand.key}" maps tier "${lengthTier}" to unknown format "${key}".`,
    );
  }
  return { key, ...format };
}
