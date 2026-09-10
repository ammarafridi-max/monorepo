import SharedBreadcrumb from '@travel-suite/frontend-shared/components/shared/layout/Breadcrumb';

/**
 * Breadcrumbs for any Picturesk page.
 *
 * This is NOT a second implementation: it is the shared Breadcrumb the travel
 * brands use, wrapped so a plain-CSS page can drop it in. The wrapper adds
 * `.shared-ui`, which is what makes a Tailwind component render correctly on this
 * site (see app/(site)/shared-ui.css), so callers do not have to remember it.
 *
 * The blog pages do not use this: the shared BlogPage / BlogPostPage render the
 * same breadcrumb themselves, inside their own layout.
 *
 * `paths` is [{ label, path }], first crumb first. The component renders a home
 * icon on a leading "Home" crumb and marks the last one aria-current="page".
 * `includeSchema` emits BreadcrumbList JSON-LD; leave it off on a page that
 * already puts breadcrumbs in its own schema graph, so the page has only one.
 *
 * @example
 * <Breadcrumb paths={[{ label: 'Home', path: '/' }, { label: 'FAQ', path: '/faq' }]} />
 */
export default function Breadcrumb({ paths = [], dark = false, includeSchema = true, className = '' }) {
  if (!paths.length) return null;

  return (
    <div className={`shared-ui${className ? ` ${className}` : ''}`}>
      <SharedBreadcrumb paths={paths} dark={dark} includeSchema={includeSchema} />
    </div>
  );
}
