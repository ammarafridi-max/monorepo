'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { buildBreadcrumbList, SITE_URL } from '../lib/schema';

export default function Breadcrumb({ paths = [], dark = false, includeSchema = true }) {
  const pathname = usePathname();
  const normalizedPaths = paths
    .map((item) => ({
      label: item?.label,
      to: item?.href || item?.path || '',
    }))
    .filter((item) => item.label);

  const isAdminRoute = pathname?.startsWith('/admin') ?? false;
  const jsonLd =
    includeSchema && normalizedPaths.length > 0
      ? buildBreadcrumbList({
          paths: normalizedPaths.map((item) => ({ label: item.label, path: item.to })),
          baseUrl: SITE_URL,
          basePath: isAdminRoute ? '/admin' : '',
        })
      : null;

  const baseClass = dark ? 'text-[14px] lg:text-sm text-white/40' : 'text-[14px] lg:text-sm text-gray-500';
  const linkClass = dark ? 'transition-colors hover:text-accent-400' : 'transition-colors hover:text-primary-600';
  const currentClass = dark ? 'text-white/80' : 'text-gray-900';

  return (
    <>
      <nav aria-label="Breadcrumb" className={baseClass}>
        <ol className="flex flex-wrap items-center gap-y-1">
          {normalizedPaths.map((item, index) => (
            <li key={`${item.label}-${index}`} className="flex items-center font-light">
              {index !== 0 && <span className="mx-2 lg:mx-3">/</span>}
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
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
          }}
        />
      )}
    </>
  );
}
