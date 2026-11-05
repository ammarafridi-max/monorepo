import { brandSiteUrl } from './siteUrl.js';

export function buildRobots(
  brand,
  { siteUrl = brandSiteUrl(brand), disallow = ['/admin'], allow = '/', userAgent = '*' } = {}
) {
  return {
    rules: { userAgent, allow, disallow },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
