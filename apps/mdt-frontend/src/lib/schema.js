import { createBrandSchema } from '@travel-suite/frontend-shared/seo/schema';
import { brandSiteUrl } from '@travel-suite/frontend-shared/seo/siteUrl';
import { getBrand } from '@travel-suite/config';

const brand = getBrand('mdt');

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
  email: brand.emails.support,
  address: brand.legal.postalAddress,
});
