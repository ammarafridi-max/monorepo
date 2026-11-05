const FORMATS_BY_TIER = {
  short: 'quick-answer',
  medium: 'sourced-guide',
  long: 'sourced-guide',
};

export function defineTarget(target) {
  const merged = { formatsByTier: FORMATS_BY_TIER, ...target };

  if (!merged.blogUrl && merged.siteUrl) {
    merged.blogUrl = (slug) => `${merged.siteUrl}/blog/${slug}`;
  }

  return merged;
}
