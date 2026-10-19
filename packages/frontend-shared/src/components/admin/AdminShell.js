'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext.js';
import { useAdminLogout } from '../../hooks/auth/useAdminLogout.js';
import { isUnderPath } from '../../utils/paths.js';

const DEFAULT_ROLE_DEFAULT_PATH = {
  admin: '/admin',
  agent: '/admin/dummy-tickets',
  'blog-manager': '/admin/blog',
  support: '/admin/account',
};

const DEFAULT_ROLE_ROUTE_RULES = [

  { prefix: '/admin/dummy-tickets',           roles: ['admin', 'agent'] },
  { prefix: '/admin/hotel-bookings',      roles: ['admin', 'agent'] },
  { prefix: '/admin/chat',                    roles: ['admin', 'agent'] },
  { prefix: '/admin/emails',                  roles: ['admin', 'agent'] },
  { prefix: '/admin/payment-links',           roles: ['admin', 'agent'] },
  { prefix: '/admin/products',                roles: ['admin', 'agent'] },
  { prefix: '/admin/account',                 roles: ['admin', 'agent', 'blog-manager', 'support'] },
  { prefix: '/admin/insurance-applications',  roles: ['admin'] },
  { prefix: '/admin/visa-applications',            roles: ['admin', 'agent'] },
  { prefix: '/admin/document-registry',       roles: ['admin'] },
  { prefix: '/admin/affiliates',              roles: ['admin'] },
  { prefix: '/admin/users',                   roles: ['admin'] },
  { prefix: '/admin/currencies',              roles: ['admin'] },
  { prefix: '/admin/pricing',                 roles: ['admin'] },
  { prefix: '/admin/revenue',                 roles: ['admin'] },
  { prefix: '/admin/blog',                    roles: ['admin', 'blog-manager'] },
  { prefix: '/admin/blog-tags',               roles: ['admin', 'blog-manager'] },

  { prefix: '/admin',                         roles: ['admin', 'agent', 'blog-manager'] },
];

function getAllowedRoles(pathname, rules) {
  return (
    rules.find((rule) => isUnderPath(pathname, rule.prefix))?.roles ||
    rules[rules.length - 1]?.roles || ['admin']
  );
}

function resolveDefaultPath(role, rules, defaultPaths) {
  const target = defaultPaths?.[role];
  if (!target) return null;
  return getAllowedRoles(target, rules).includes(role) ? target : null;
}

function LoadingScreen({ message = 'Loading admin workspace...' }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-gray-400">
        <Loader2 size={28} className="animate-spin" />
        <p className="text-sm font-medium">{message}</p>
      </div>
    </div>
  );
}

function NoAccessScreen({ role }) {
  const { logout, loggingOut } = useAdminLogout();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 max-w-md w-full text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert size={22} className="text-amber-600" />
        </div>
        <h1 className="text-xl font-extrabold text-gray-900">
          You do not have access to this workspace
        </h1>
        <p className="mt-2 text-sm text-gray-500 leading-relaxed">
          {role
            ? `Your account role (${role}) has no pages assigned in this admin area.`
            : 'Your account has no pages assigned in this admin area.'}{' '}
          Ask an administrator to update your role, then sign in again.
        </p>
        <button
          onClick={logout}
          disabled={loggingOut}
          className="mt-6 w-full py-2.5 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loggingOut ? 'Signing out...' : 'Sign out'}
        </button>
      </div>
    </div>
  );
}

export default function AdminShell({
  children,
  roleRules = DEFAULT_ROLE_ROUTE_RULES,
  roleDefaultPath = DEFAULT_ROLE_DEFAULT_PATH,
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { adminUser, isLoadingAdminAuth } = useAdminAuth();

  useEffect(() => {
    if (isLoadingAdminAuth) return;

    if (!adminUser) {
      const next = encodeURIComponent(pathname || '/admin');
      router.replace(`/admin/login?next=${next}`);
      return;
    }

    const allowedRoles = getAllowedRoles(pathname || '/admin', roleRules);
    if (allowedRoles.includes(adminUser.role)) return;

    const fallback = resolveDefaultPath(adminUser.role, roleRules, roleDefaultPath);
    if (fallback) router.replace(fallback);
  }, [adminUser, isLoadingAdminAuth, pathname, router, roleRules, roleDefaultPath]);

  if (isLoadingAdminAuth || !adminUser) {
    return <LoadingScreen />;
  }

  const allowedRoles = getAllowedRoles(pathname || '/admin', roleRules);
  if (!allowedRoles.includes(adminUser.role)) {
    return resolveDefaultPath(adminUser.role, roleRules, roleDefaultPath) ? (
      <LoadingScreen message="Redirecting to your workspace..." />
    ) : (
      <NoAccessScreen role={adminUser.role} />
    );
  }

  return children;
}
