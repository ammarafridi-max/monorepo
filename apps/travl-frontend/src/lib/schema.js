import {
  createSchemaBuilders,
  buildFAQPage,
  buildBreadcrumbList as _buildBreadcrumbList,
  buildGraph,
} from '@travel-suite/frontend-shared/utils/schema';
import { buildMetadata as _buildMetadata } from '@travel-suite/frontend-shared/utils/publicMetadata';

export const SITE_URL = 'https://www.travl.ae';

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
  siteName: 'Travl',
  logoUrl: `${SITE_URL}/logo.webp`,
  email: 'info@travl.ae',
  address: {
    streetAddress: 'Abraj Al Mamzar',
    addressLocality: 'Al Mamzar',
    addressRegion: 'Dubai',
    addressCountry: 'AE',
  },
  contactPoint: {
    email: 'info@travl.ae',
    contactType: 'customer support',
    availableLanguage: 'English',
    hoursAvailable: 'Mo-Su 00:00-24:00',
  },
});

export { buildFAQPage, buildGraph };

export const buildBreadcrumbList = (opts = {}) =>
  _buildBreadcrumbList({ baseUrl: SITE_URL, ...opts });

export const buildMetadata = (opts) => _buildMetadata({ siteUrl: SITE_URL, ...opts });
