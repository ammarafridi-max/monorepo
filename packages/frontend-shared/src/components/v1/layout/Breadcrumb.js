'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

  const navClass = dark ? 'text-white/45' : 'text-gray-500';
  const linkClass = dark
    ? 'transition-colors hover:text-white/80'
    : 'transition-colors hover:text-primary-600';
  const currentClass = dark ? 'text-white/85' : 'text-gray-900';

  return (
    <>
      <nav aria-label="Breadcrumb" className={`text-[14px] lg:text-sm ${navClass}`}>
        <ol className="flex flex-wrap items-center gap-y-1">
          {normalizedPaths.map((item, index) => (
            <li key={`${item.label}-${index}`} className="flex items-center font-light">
              {index > 0 && <span className="mx-2 lg:mx-3">/</span>}
              {index === normalizedPaths.length - 1 || !item.to ? (
                <span aria-current="page" className={currentClass}>
                  {item.label}
                </span>
              ) : (
                <Link href={item.to} className={linkClass}>
                  {item.label}
                </Link>
              )}
            </li>
          ))}
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
