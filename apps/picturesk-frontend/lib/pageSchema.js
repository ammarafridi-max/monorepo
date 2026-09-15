import {
  SITE_URL,
  buildBreadcrumbList,
  buildGraph,
  buildOrganization,
  buildWebPage,
  buildWebsite,
} from './schema';

/**
 * The standard graph every content page emits: Organization, WebSite, WebPage and
 * a BreadcrumbList back to the product page. Pages with something extra to say
 * (an FAQPage, say) pass it in `extra`.
 *
 * Breadcrumbs start at the AI Headshot Generator page, not "/", because that is
 * the canonical home of the product and "/" only redirects to it.
 */
export function contentPageSchema({ path, title, description, label, extra = [] }) {
  const canonical = `${SITE_URL}${path}`;
  const paths = [
    { label: 'AI Headshot Generator', path: '/ai-headshot-generator' },
    { label, path },
  ];

  // The breadcrumb builder returns a standalone document with its own @context.
  // Inside a @graph that context is redundant, so it is stripped and the node is
  // folded in, leaving the page with ONE script tag and one graph.
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
