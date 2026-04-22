export const SITE_URL = 'https://www.travl.ae';
const SITE_NAME = 'Travl';
const LOGO_URL = `${SITE_URL}/logo.webp`;

const organizationId = `${SITE_URL}/#organization`;
const websiteId = `${SITE_URL}/#website`;

export const buildOrganization = () => ({
  '@type': 'Organization',
  '@id': organizationId,
  name: SITE_NAME,
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: LOGO_URL,
  },
  email: 'info@travl.ae',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Abraj Al Mamzar',
    addressLocality: 'Al Mamzar',
    addressRegion: 'Dubai',
    addressCountry: 'AE',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'info@travl.ae',
    contactType: 'customer support',
    availableLanguage: 'English',
    hoursAvailable: 'Mo-Su 00:00-24:00',
  },
});

export const buildWebsite = () => ({
  '@type': 'WebSite',
  '@id': websiteId,
  name: SITE_NAME,
  url: SITE_URL,
  publisher: { '@id': organizationId },
});

export const buildWebPage = ({ canonical, title, description }) => ({
  '@type': 'WebPage',
  '@id': `${canonical}#webpage`,
  url: canonical,
  name: title,
  description,
  isPartOf: { '@id': websiteId },
  publisher: { '@id': organizationId },
});

export const buildFAQPage = ({ canonical, title, description, faqs }) => ({
  '@type': 'FAQPage',
  '@id': `${canonical}#faq`,
  url: canonical,
  name: title,
  description,
  mainEntity: (faqs || []).map(faq => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
});

export const buildBlog = ({ canonical, title, description }) => ({
  '@type': 'Blog',
  '@id': `${canonical}#blog`,
  url: canonical,
  name: title,
  description,
  publisher: { '@id': organizationId },
});

export const buildBlogPosting = ({
  canonical,
  title,
  description,
  image,
  datePublished,
  dateModified,
  authorName,
}) => ({
  '@type': 'BlogPosting',
  '@id': `${canonical}#blogpost`,
  headline: title,
  description,
  image: image ? [image] : undefined,
  author: authorName ? { '@type': 'Person', name: authorName } : undefined,
  datePublished: datePublished || undefined,
  dateModified: dateModified || datePublished || undefined,
  publisher: { '@id': organizationId },
  mainEntityOfPage: { '@id': `${canonical}#webpage` },
});

export const buildService = ({ canonical, name, description, areaServed }) => ({
  '@type': 'Service',
  '@id': `${canonical}#service`,
  name,
  description,
  serviceType: name,
  url: canonical,
  areaServed,
  provider: { '@id': organizationId },
});

export const buildProduct = ({ canonical, name, description, price, currency = 'AED', availability = 'https://schema.org/InStock' }) => ({
  '@type': 'Product',
  '@id': `${canonical}#product`,
  name,
  description,
  url: canonical,
  brand: { '@id': organizationId },
  offers: {
    '@type': 'Offer',
    price,
    priceCurrency: currency,
    availability,
    url: canonical,
    seller: { '@id': organizationId },
  },
});

const toAbsoluteUrl = ({ baseUrl = SITE_URL, value = '/', basePath = '' }) => {
  if (!value) return baseUrl;
  if (/^https?:\/\//i.test(value)) return value;

  const normalizedBasePath = basePath ? `/${String(basePath).replace(/^\/+|\/+$/g, '')}` : '';
  const normalizedValue = value.startsWith('/') ? value : `/${value}`;
  const needsBasePath =
    normalizedBasePath &&
    normalizedValue !== normalizedBasePath &&
    !normalizedValue.startsWith(`${normalizedBasePath}/`);

  return `${baseUrl}${needsBasePath ? `${normalizedBasePath}${normalizedValue}` : normalizedValue}`;
};

export const buildBreadcrumbList = ({ paths = [], baseUrl = SITE_URL, basePath = '' } = {}) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: paths.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.label,
    item: toAbsoluteUrl({
      baseUrl,
      value: item.href || item.path || '/',
      basePath,
    }),
  })),
});

export const buildGraph = items => ({
  '@context': 'https://schema.org',
  '@graph': items,
});
