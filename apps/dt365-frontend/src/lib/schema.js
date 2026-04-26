import {
  createSchemaBuilders,
  buildFAQPage,
  buildBreadcrumbList as _buildBreadcrumbList,
  buildGraph,
} from '@travel-suite/frontend-shared/utils/schema';
import { buildMetadata as _buildMetadata } from '@travel-suite/frontend-shared/utils/publicMetadata';

export const SITE_URL = 'https://www.dummyticket365.com';

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
  siteName: 'Dummy Ticket 365',
  logoUrl: `${SITE_URL}/logo.png`,
  email: 'info@dummyticket365.com',
  address: {
    streetAddress: 'Abraj Al Mamzar',
    addressLocality: 'Al Mamzar',
    addressRegion: 'Dubai',
    addressCountry: 'AE',
  },
  contactPoint: {
    email: 'info@dummyticket365.com',
    contactType: 'customer support',
    availableLanguage: 'English',
    hoursAvailable: 'Mo-Su 00:00-24:00',
  },
});

export { buildFAQPage, buildGraph };

export const buildBreadcrumbList = (opts = {}) =>
  _buildBreadcrumbList({ baseUrl: SITE_URL, ...opts });

export const buildMetadata = (opts) => _buildMetadata({ siteUrl: SITE_URL, ...opts });
