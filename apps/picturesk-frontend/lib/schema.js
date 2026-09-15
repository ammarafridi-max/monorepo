import {
  createSchemaBuilders,
  buildFAQPage,
  buildBreadcrumbList as _buildBreadcrumbList,
  buildGraph,
} from '@travel-suite/frontend-shared/utils/schema';
import { buildMetadata as _buildMetadata } from '@travel-suite/frontend-shared/utils/publicMetadata';
import { SITE_URL } from './seo';

export { SITE_URL };

export const {
  buildOrganization,
  buildWebsite,
  buildWebPage,
  buildCollectionPage,
  buildPerson,
  buildProfilePage,
  buildBlog,
  buildBlogPosting,
  buildService,
  buildProduct,
} = createSchemaBuilders({
  siteUrl: SITE_URL,
  siteName: 'Picturesk',
  logoUrl: `${SITE_URL}/logo.png`,
  email: 'info@picturesk.ai',
  contactPoint: {
    email: 'info@picturesk.ai',
    contactType: 'customer support',
    availableLanguage: 'English',
  },
});

export { buildFAQPage, buildGraph };

export const buildBreadcrumbList = (opts = {}) => _buildBreadcrumbList({ baseUrl: SITE_URL, ...opts });

// No og-image.png ships with this site, so the logo stands in for share cards.
export const buildMetadata = (opts) => _buildMetadata({ siteUrl: SITE_URL, images: [`${SITE_URL}/logo.png`], ...opts });
