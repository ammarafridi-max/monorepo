'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminAuth } from './AdminAuthContext';
import { adminLogout } from '../../lib/adminApi';

/**
 * The client-side guard + chrome for the admin area. While the session is loading
 * it shows a calm full-screen state; with no session it redirects to the login
 * page (carrying ?next so the admin returns where they were). Once authenticated
 * it renders the sidebar + the page. Note: this guard is UX only. The real
 * security boundary is server-side: every /admin call validates the cookie + role.
 */
const NAV = [
  { href: '/admin', label: 'Overview', exact: true },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/customers', label: 'Customers' },
  { href: '/admin/admins', label: 'Team', roles: ['admin'] },
  { href: '/admin/account', label: 'Account' },
];

export default function AdminShell({ children }) {
  const { adminUser, loading, setAdminUser } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!adminUser) {
      router.replace(`/admin/login?next=${encodeURIComponent(pathname || '/admin')}`);
    }
  }, [adminUser, loading, pathname, router]);

  if (loading || !adminUser) {
    return <div className="adm-boot">Loading admin</div>;
  }

  async function handleLogout() {
    try {
      await adminLogout();
    } catch {
      /* clearing local state below is enough even if the network call fails */
    }
    setAdminUser(null);
    router.replace('/admin/login');
  }

  return (
    <div className="adm">
      <aside className="adm-side">
        <div>
          <div className="adm-brandrow">
            <Link href="/admin" className="adm-brand">
              Picturesk
            </Link>
            <span className="adm-tag">Admin</span>
          </div>
          <nav className="adm-nav">
            {NAV.filter((n) => !n.roles || n.roles.includes(adminUser.role)).map((n) => {
              const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
              return (
                <Link key={n.href} href={n.href} className={active ? 'active' : ''}>
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="adm-side__foot">
          <div className="adm-who">{adminUser.name}</div>
          <div className="adm-who__role">{adminUser.role}</div>
          <button type="button" className="adm-logout" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>

      <main className="adm-main">{children}</main>
    </div>
  );
}
