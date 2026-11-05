import { createBrandSchema } from '@travel-suite/frontend-shared/seo/schema';
import { brandSiteUrl } from '@travel-suite/frontend-shared/seo/siteUrl';
import { getBrand } from '@travel-suite/config';
import { EMAIL, WHATSAPP_NUMBER } from '@/config/contact';

const brand = getBrand('dt365');

export const SITE_URL = brandSiteUrl(brand);

export const {
  buildOrganization,
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
} = createBrandSchema({
  siteUrl: SITE_URL,
  siteName: brand.name,
  logoUrl: `${SITE_URL}/logo-icon.png`,
  email: EMAIL,
  telephone: WHATSAPP_NUMBER,
  sameAs: [
    'https://www.facebook.com/dummyticket365',
    'https://www.instagram.com/dummyticket365',
  ],
  address: brand.legal.postalAddress,
  contactPoint: {
    email: EMAIL,
    telephone: WHATSAPP_NUMBER,
    contactType: 'customer support',
    availableLanguage: 'English',
    hoursAvailable: 'Mo-Su 00:00-24:00',
  },
});
