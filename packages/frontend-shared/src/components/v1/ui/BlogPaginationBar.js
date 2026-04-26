import Link from 'next/link';

/**
 * Reusable pagination bar for blog listing pages.
 *
 * Props:
 *   pagination   — pagination object from the API { totalPages, hasPrevPage, hasNextPage, total, limit, page }
 *   currentPage  — current active page number
 *   basePath     — base URL path used to build prev/next hrefs (e.g. '/blog' or '/blog/tags/my-tag')
 */
export default function BlogPaginationBar({ pagination, currentPage, basePath = '/blog' }) {
  if (!pagination || pagination.totalPages <= 1) return null;

  const prevHref =
    currentPage - 1 <= 1 ? basePath : `${basePath}?page=${currentPage - 1}`;
  const nextHref = `${basePath}?page=${currentPage + 1}`;

  return (
    <div className="mt-8 flex items-center justify-between gap-4 border-t border-gray-200 pt-6">
      <p className="text-sm text-gray-600">
        Showing{' '}
        {pagination.total > 0 ? (currentPage - 1) * pagination.limit + 1 : 0} –{' '}
        {pagination.total > 0
          ? Math.min(currentPage * pagination.limit, pagination.total)
          : 0}{' '}
        of {pagination.total}
      </p>
      <div className="flex items-center gap-3">
        <PageLink href={prevHref} disabled={!pagination.hasPrevPage}>
          Previous
        </PageLink>
        <span className="text-sm text-gray-600">
          {currentPage} / {pagination.totalPages}
        </span>
        <PageLink href={nextHref} disabled={!pagination.hasNextPage}>
          Next
        </PageLink>
      </div>
    </div>
  );
}

function PageLink({ href, disabled, children }) {
  const base =
    'rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-100';

  if (disabled) {
    return <span className={`${base} cursor-not-allowed opacity-50`}>{children}</span>;
  }

  return (
    <Link href={href} className={base}>
      {children}
    </Link>
  );
}
