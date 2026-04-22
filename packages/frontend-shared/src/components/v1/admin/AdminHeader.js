'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdminAuth } from '../../../contexts/AdminAuthContext.js';

const PAGE_TITLES = {
  '/admin': 'Dashboard',
  '/admin/dummy-tickets': 'Dummy Tickets',
  '/admin/insurance-applications': 'Insurance',
  '/admin/blogs': 'Blog',
  '/admin/blog-tags': 'Blog Tags',
  '/admin/currencies': 'Currencies',
  '/admin/pricing': 'Pricing',
  '/admin/users': 'Admin Users',
  '/admin/affiliates': 'Affiliates',
  '/admin/account': 'My Account',

};

const ROLE_LABELS = {
  admin: 'Admin',
  agent: 'Agent',
  'blog-manager': 'Blog Manager',
};

export default function AdminHeader() {
  const pathname = usePathname();
  const { adminUser } = useAdminAuth();

  const title =
    PAGE_TITLES[pathname] ??
    Object.entries(PAGE_TITLES)
      .filter(([path]) => pathname.startsWith(path) && path !== '/admin')
      .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ??
    'Admin';

  const initials = adminUser?.name
    ? adminUser.name
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0 pl-16 lg:pl-6">
      <h1 className="text-sm font-bold text-gray-900">{title}</h1>

      {adminUser && (
        <Link
          href="/admin/account"
          className="flex items-center gap-2.5 hover:opacity-80 transition"
        >
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-gray-800 leading-none">
              {adminUser.name}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5 capitalize">
              {ROLE_LABELS[adminUser.role] ?? adminUser.role}
            </p>
          </div>
          <div className="w-7 h-7 rounded-full bg-primary-700 flex items-center justify-center shrink-0">
            <span className="text-[11px] font-bold text-white">{initials}</span>
          </div>
        </Link>
      )}
    </header>
  );
}
