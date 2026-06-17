import {
  createSchemaBuilders,
  buildFAQPage,
  buildBreadcrumbList as _buildBreadcrumbList,
  buildGraph,
} from '@travel-suite/frontend-shared/utils/schema';

export const SITE_URL = 'https://www.emirateslimo.com';

export const {
  buildOrganization,
  buildWebsite,
  buildWebPage,
  buildBlog,
  buildBlogPosting,
  buildService,
  buildProduct,
} = createSchemaBuilders({
  siteUrl: SITE_URL,
  siteName: 'Emirates Limo',
  logoUrl: `${SITE_URL}/logo-light.webp`,
});

export { buildFAQPage, buildGraph };

export const buildBreadcrumbList = (opts = {}) =>
  _buildBreadcrumbList({ baseUrl: SITE_URL, ...opts });
