// ─── Brand-aware factory ────────────────────────────────────────────────────
// Call once per frontend to get builders pre-bound to that brand's IDs/URLs.

export function createSchemaBuilders({
  siteUrl,
  siteName,
  logoUrl,
  email,
  address,
  contactPoint,
}) {
  const organizationId = `${siteUrl}/#organization`;
  const websiteId = `${siteUrl}/#website`;

  const buildOrganization = () => ({
    '@type': 'Organization',
    '@id': organizationId,
    name: siteName,
    url: siteUrl,
    logo: { '@type': 'ImageObject', url: logoUrl },
    ...(email ? { email } : {}),
    ...(address ? { address: { '@type': 'PostalAddress', ...address } } : {}),
    ...(contactPoint
      ? { contactPoint: { '@type': 'ContactPoint', ...contactPoint } }
      : {}),
  });

  const buildWebsite = () => ({
    '@type': 'WebSite',
    '@id': websiteId,
    name: siteName,
    url: siteUrl,
    publisher: { '@id': organizationId },
  });

  const buildWebPage = ({ canonical, title, description }) => ({
    '@type': 'WebPage',
    '@id': `${canonical}#webpage`,
    url: canonical,
    name: title,
    description,
    isPartOf: { '@id': websiteId },
    publisher: { '@id': organizationId },
  });

  const buildBlog = ({ canonical, title, description }) => ({
    '@type': 'Blog',
    '@id': `${canonical}#blog`,
    url: canonical,
    name: title,
    description,
    publisher: { '@id': organizationId },
  });

  const buildBlogPosting = ({
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

  const buildService = ({ canonical, name, description, areaServed }) => ({
    '@type': 'Service',
    '@id': `${canonical}#service`,
    name,
    description,
    serviceType: name,
    url: canonical,
    areaServed,
    provider: { '@id': organizationId },
  });

  const buildProduct = ({
    canonical,
    name,
    description,
    price,
    currency = 'USD',
    availability = 'https://schema.org/InStock',
  }) => ({
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

  return {
    buildOrganization,
    buildWebsite,
    buildWebPage,
    buildBlog,
    buildBlogPosting,
    buildService,
    buildProduct,
  };
}

// ─── Pure builders (no brand data needed) ───────────────────────────────────

const toAbsoluteUrl = ({ baseUrl = '', value = '/', basePath = '' }) => {
  if (!value) return baseUrl;
  if (/^https?:\/\//i.test(value)) return value;

  const normalizedBasePath = basePath
    ? `/${String(basePath).replace(/^\/+|\/+$/g, '')}`
    : '';
  const normalizedValue = value.startsWith('/') ? value : `/${value}`;
  const needsBasePath =
    normalizedBasePath &&
    normalizedValue !== normalizedBasePath &&
    !normalizedValue.startsWith(`${normalizedBasePath}/`);

  return `${baseUrl}${needsBasePath ? `${normalizedBasePath}${normalizedValue}` : normalizedValue}`;
};

export const buildFAQPage = ({ canonical, title, description, faqs }) => ({
  '@type': 'FAQPage',
  '@id': `${canonical}#faq`,
  url: canonical,
  name: title,
  description,
  mainEntity: (faqs || []).map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
});

export const buildBreadcrumbList = ({
  paths = [],
  baseUrl = '',
  basePath = '',
} = {}) => ({
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

export const buildGraph = (items) => ({
  '@context': 'https://schema.org',
  '@graph': items,
});
