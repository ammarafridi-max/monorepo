import {
  SITE_URL,
  buildBreadcrumbList,
  buildGraph,
  buildOrganization,
  buildWebPage,
  buildWebsite,
} from './schema';

export function contentPageSchema({ path, title, description, label, extra = [] }) {
  const canonical = `${SITE_URL}${path}`;
  const paths = [
    { label: 'AI Headshot Generator', path: '/ai-headshot-generator' },
    { label, path },
  ];

  const { '@context': _context, ...breadcrumb } = buildBreadcrumbList({ paths });

  return {
    canonical,
    graph: buildGraph([
      buildOrganization(),
      buildWebsite(),
      buildWebPage({ canonical, title, description }),
      breadcrumb,
      ...extra,
    ]),
  };
}
