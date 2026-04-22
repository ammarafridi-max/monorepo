const toAbsoluteUrl = ({ baseUrl = '/', value = '/', basePath = '' }) => {
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

export const buildBreadcrumbList = ({ paths = [], baseUrl = '/', basePath = '' } = {}) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: paths.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.label,
    item: toAbsoluteUrl({ baseUrl, value: item.href || item.path || '/', basePath }),
  })),
});
