import {
  createSchemaBuilders,
  buildFAQPage,
  buildBreadcrumbList as _buildBreadcrumbList,
  buildGraph,
} from '@travel-suite/frontend-shared/utils/schema';
import { buildMetadata as _buildMetadata } from '@travel-suite/frontend-shared/utils/publicMetadata';

export const SITE_URL = 'https://www.emirateslimo.com';
export const PHONE = '+971569964924';
export const EMAIL = 'contact@emirateslimo.com';

const builders = createSchemaBuilders({
  siteUrl: SITE_URL,
  siteName: 'Emirates Limo',
  legalName: 'TRAVL Technologies',
  logoUrl: `${SITE_URL}/logo-light.webp`,
  email: EMAIL,
  telephone: PHONE,
  sameAs: ['https://www.facebook.com/emirateslimo', 'https://www.instagram.com/emirateslimo'],
  address: {
    streetAddress: 'A Block, Abraj Al Mamzar',
    addressLocality: 'Dubai',
    addressRegion: 'Dubai',
    addressCountry: 'AE',
  },
  contactPoint: {
    telephone: PHONE,
    email: EMAIL,
    contactType: 'customer support',
    availableLanguage: 'English',
    hoursAvailable: 'Mo-Su 00:00-24:00',
  },
});

export const {
  buildWebsite,
  buildWebPage,
  buildCollectionPage,
  buildBlog,
  buildBlogPosting,
  buildService,
  buildProduct,
  buildPerson,
  buildProfilePage,
} = builders;

// The shared builder emits a plain Organization; a chauffeur company is also a
// LocalBusiness, so the same @id carries both types plus the local fields.
export const buildOrganization = () => ({
  ...builders.buildOrganization(),
  '@type': ['Organization', 'LimousineService'],
  image: `${SITE_URL}/logo-light.webp`,
  priceRange: '$$',
  openingHours: ['Mo-Su 00:00-23:59'],
  geo: { '@type': 'GeoCoordinates', latitude: 25.2842, longitude: 55.3311 },
  areaServed: [
    { '@type': 'City', name: 'Dubai' },
    { '@type': 'City', name: 'Abu Dhabi' },
    { '@type': 'City', name: 'Sharjah' },
  ],
});

export { buildFAQPage, buildGraph };

export const buildBreadcrumbList = (opts = {}) =>
  _buildBreadcrumbList({ baseUrl: SITE_URL, ...opts });

export const buildMetadata = (opts) =>
  _buildMetadata({ siteUrl: SITE_URL, images: [`${SITE_URL}/hero-bg.webp`], ...opts });
