import {
  createSchemaBuilders,
  buildFAQPage,
  buildBreadcrumbList,
  buildGraph,
} from '../utils/schema.js';
import { buildMetadata } from '../utils/publicMetadata.js';

const supportContactPoint = (email) => ({
  email,
  contactType: 'customer support',
  availableLanguage: 'English',
  hoursAvailable: 'Mo-Su 00:00-24:00',
});

export function createBrandSchema({ siteUrl, defaultImages, contactPoint, ...identity }) {
  return {
    ...createSchemaBuilders({
      siteUrl,
      contactPoint: contactPoint ?? supportContactPoint(identity.email),
      ...identity,
    }),
    buildFAQPage,
    buildGraph,
    buildBreadcrumbList: (opts = {}) => buildBreadcrumbList({ baseUrl: siteUrl, ...opts }),
    buildMetadata: (opts) =>
      buildMetadata({ siteUrl, ...(defaultImages ? { images: defaultImages } : {}), ...opts }),
  };
}
