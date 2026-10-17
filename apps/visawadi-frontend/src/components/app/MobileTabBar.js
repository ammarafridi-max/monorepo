'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, FileText, Menu } from 'lucide-react';

const TABS = [
  { href: '/', label: 'Home', icon: Home, match: (p) => p === '/' || p === '/uae' },
  { href: '/visa-check', label: 'Check', icon: Search, match: (p) => p.startsWith('/visa-check') },
  { href: '/uae', label: 'Apply', icon: FileText, match: (p) => p.includes('/visa/') },
  { href: '/blog', label: 'Guides', icon: Menu, match: (p) => p.startsWith('/blog') },
];

export default function MobileTabBar() {
  const pathname = usePathname() || '/';

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <ul className="grid grid-cols-4">
        {TABS.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={label}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-[58px] flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors ${
                  active ? 'text-primary-700' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon size={23} strokeWidth={active ? 2.2 : 1.8} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
