import {
  createSchemaBuilders,
  buildFAQPage,
  buildBreadcrumbList as _buildBreadcrumbList,
  buildGraph,
} from '@travel-suite/frontend-shared/utils/schema';
import { buildMetadata as _buildMetadata } from '@travel-suite/frontend-shared/utils/publicMetadata';
import { EMAIL, WHATSAPP_NUMBER, SOCIALS, LEGAL_NAME } from '@/config/contact';

export const SITE_URL = 'https://www.visawadi.com';

export const {
  buildOrganization,
  buildWebsite,
  buildWebPage,
  buildBlog,
  buildBlogPosting,
  buildPerson,
  buildProfilePage,
  buildService,
  buildProduct,
} = createSchemaBuilders({
  siteUrl: SITE_URL,
  siteName: 'VisaWadi',
  legalName: LEGAL_NAME,
  telephone: WHATSAPP_NUMBER,
  sameAs: SOCIALS.map((s) => s.href),
  logoUrl: `${SITE_URL}/logo-dark.png`,
  email: EMAIL,
  // TODO: replace with VisaWadi's registered address once confirmed.
  address: {
    addressLocality: 'Dubai',
    addressRegion: 'Dubai',
    addressCountry: 'AE',
  },
  contactPoint: {
    email: EMAIL,
    contactType: 'customer support',
    availableLanguage: 'English',
    hoursAvailable: 'Mo-Su 00:00-24:00',
  },
});

export { buildFAQPage, buildGraph };

export const buildBreadcrumbList = (opts = {}) =>
  _buildBreadcrumbList({ baseUrl: SITE_URL, ...opts });

export const buildMetadata = (opts) => _buildMetadata({ siteUrl: SITE_URL, ...opts });
