import {
  createSchemaBuilders,
  buildFAQPage,
  buildBreadcrumbList as _buildBreadcrumbList,
  buildGraph,
} from '@travel-suite/frontend-shared/utils/schema';
import { buildMetadata as _buildMetadata } from '@travel-suite/frontend-shared/utils/publicMetadata';
import { EMAIL, WHATSAPP_NUMBER, POSTAL_ADDRESS, LEGAL_NAME, SOCIALS } from '@/config/contact';

export const SITE_URL = 'https://www.travl.ae';

export const {
  buildOrganization,
  buildWebsite,
  buildWebPage,
  buildCollectionPage,
  buildBlog,
  buildBlogPosting,
  buildService,
  buildProduct,
  buildPerson,
  buildProfilePage,
} = createSchemaBuilders({
  siteUrl: SITE_URL,
  siteName: 'Travl',
  legalName: LEGAL_NAME,
  logoUrl: `${SITE_URL}/logo.webp`,
  email: EMAIL,
  telephone: WHATSAPP_NUMBER,
  sameAs: SOCIALS.filter((s) => s.platform !== 'maps').map((s) => s.href),
  address: POSTAL_ADDRESS,
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
