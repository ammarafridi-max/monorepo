import { createBrandSchema } from '@travel-suite/frontend-shared/seo/schema';
import { brandSiteUrl } from '@travel-suite/frontend-shared/seo/siteUrl';
import { getBrand } from '@travel-suite/config';
import { EMAIL, WHATSAPP_NUMBER, SOCIALS, LEGAL_NAME } from '@/config/contact';

const brand = getBrand('visawadi');

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
  legalName: LEGAL_NAME,
  logoUrl: `${SITE_URL}/logo-dark.png`,
  email: EMAIL,
  telephone: WHATSAPP_NUMBER,
  sameAs: SOCIALS.map((s) => s.href),
  address: {
    addressLocality: 'Dubai',
    addressRegion: 'Dubai',
    addressCountry: 'AE',
  },
});
