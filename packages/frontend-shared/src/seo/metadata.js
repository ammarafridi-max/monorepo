import { brandSiteUrl } from './siteUrl.js';

const dropNulls = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== null));

export function buildRootMetadata(
  brand,
  {
    siteUrl = brandSiteUrl(brand),
    title = brand.seo.defaultTitle,
    description = brand.seo.defaultDescription,
    icons = { icon: '/favicon.png' },
    openGraph = {},
    ...rest
  } = {}
) {
  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    icons,
    openGraph: dropNulls({
      title: typeof title === 'string' ? title : title.default,
      description,
      url: siteUrl,
      siteName: brand.name,
      images: [brand.seo.ogImage],
      ...openGraph,
    }),
    ...rest,
  };
}
