'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HiChevronRight, HiOutlineHome } from 'react-icons/hi2';
import { buildBreadcrumbList } from '../../../utils/breadcrumb';

export default function Breadcrumb({ paths = [], dark = false, includeSchema = true }) {
  const normalizedPaths = paths
    .map((item) => ({
      label: item?.label,
      to: item?.href || item?.path || '',
    }))
    .filter((item) => item.label);

  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');
  const jsonLd =
    includeSchema && normalizedPaths.length > 0
      ? buildBreadcrumbList({
          paths: normalizedPaths.map((item) => ({ label: item.label, path: item.to })),
          baseUrl: process.env.NEXT_PUBLIC_BASE_URL ?? '/',
          basePath: isAdminRoute ? '/admin' : '',
        })
      : null;

  const navClass = dark ? 'text-white/55' : 'text-gray-500';
  const linkClass = dark
    ? 'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 -mx-1.5 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40'
    : 'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 -mx-1.5 transition-colors hover:bg-primary-50 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300';
  const currentClass = dark
    ? 'text-white font-medium'
    : 'text-gray-900 font-medium';
  const separatorClass = dark ? 'text-white/30' : 'text-gray-300';

  return (
    <>
      <nav
        aria-label="Breadcrumb"
        className={`text-[13px] md:text-sm tracking-tight ${navClass}`}
      >
        {/* Single-line: ancestor crumbs keep their natural width; the last
            (current-page) crumb takes the remaining space and truncates with
            an ellipsis when it would otherwise wrap. */}
        <ol className="flex items-center min-w-0">
          {normalizedPaths.map((item, index) => {
            const isLast = index === normalizedPaths.length - 1;
            const isHome = index === 0 && /^home$/i.test(item.label);
            return (
              <li
                key={`${item.label}-${index}`}
                className={`flex items-center ${isLast ? 'min-w-0 flex-1' : 'shrink-0'}`}
              >
                {index > 0 && (
                  <HiChevronRight
                    aria-hidden="true"
                    className={`mx-1 shrink-0 text-[14px] ${separatorClass}`}
                  />
                )}
                {isLast || !item.to ? (
                  <span
                    aria-current="page"
                    className={`inline-flex min-w-0 items-center gap-1 ${currentClass}`}
                  >
                    {isHome && (
                      <HiOutlineHome
                        aria-hidden="true"
                        className="shrink-0 text-[14px]"
                      />
                    )}
                    <span className="truncate">{item.label}</span>
                  </span>
                ) : (
                  <Link href={item.to} className={linkClass}>
                    {isHome && (
                      <HiOutlineHome
                        aria-hidden="true"
                        className="shrink-0 text-[14px]"
                      />
                    )}
                    <span className="font-normal">{item.label}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
    </>
  );
}
