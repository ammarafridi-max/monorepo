import { createBrandSchema } from '@travel-suite/frontend-shared/seo/schema';
import { brandSiteUrl } from '@travel-suite/frontend-shared/seo/siteUrl';
import { getBrand } from '@travel-suite/config';

const brand = getBrand('emirateslimo');

export const SITE_URL = brandSiteUrl(brand);
export const PHONE = '+971569964924';
export const EMAIL = brand.emails.support;

const schema = createBrandSchema({
  siteUrl: SITE_URL,
  siteName: brand.name,
  legalName: 'TRAVL Technologies',
  logoUrl: `${SITE_URL}/logo-light.webp`,
  email: EMAIL,
  telephone: PHONE,
  defaultImages: [`${SITE_URL}/hero-bg.webp`],
  sameAs: ['https://www.facebook.com/emirateslimo', 'https://www.instagram.com/emirateslimo'],
  address: brand.legal.postalAddress,
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
  buildPerson,
  buildProfilePage,
  buildService,
  buildProduct,
  buildFAQPage,
  buildGraph,
  buildBreadcrumbList,
  buildMetadata,
} = schema;

export const buildOrganization = () => ({
  ...schema.buildOrganization(),
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
