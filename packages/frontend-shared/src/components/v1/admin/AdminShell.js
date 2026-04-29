'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAdminAuth } from '../../../contexts/AdminAuthContext.js';

const ROLE_DEFAULT_PATH = {
  admin: '/admin',
  agent: '/admin/dummy-tickets',
  'blog-manager': '/admin/blog',
};

const ROLE_ROUTE_RULES = [
  // Most-specific rules first
  { prefix: '/admin/dummy-tickets',           roles: ['admin', 'agent'] },
  { prefix: '/admin/payment-links',           roles: ['admin', 'agent'] },
  { prefix: '/admin/products',                roles: ['admin', 'agent'] },
  { prefix: '/admin/account',                 roles: ['admin', 'agent', 'blog-manager'] },
  { prefix: '/admin/insurance-applications',  roles: ['admin'] },
  { prefix: '/admin/affiliates',              roles: ['admin'] },
  { prefix: '/admin/users',                   roles: ['admin'] },
  { prefix: '/admin/currencies',              roles: ['admin'] },
  { prefix: '/admin/pricing',                 roles: ['admin'] },
  { prefix: '/admin/revenue',                 roles: ['admin'] },
  { prefix: '/admin/blog',                    roles: ['admin', 'blog-manager'] },
  { prefix: '/admin/blog-tags',               roles: ['admin', 'blog-manager'] },
  // Dashboard — all roles but agent is shown a restricted view
  { prefix: '/admin',                         roles: ['admin', 'agent', 'blog-manager'] },
];

function getAllowedRoles(pathname) {
  return (
    ROLE_ROUTE_RULES.find((rule) => pathname.startsWith(rule.prefix))
      ?.roles || ['admin', 'agent', 'blog-manager']
  );
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

export default function AdminShell({ children }) {
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

    const allowedRoles = getAllowedRoles(pathname || '/admin');
    if (!allowedRoles.includes(adminUser.role)) {
      router.replace(ROLE_DEFAULT_PATH[adminUser.role] || '/admin');
    }
  }, [adminUser, isLoadingAdminAuth, pathname, router]);

  if (isLoadingAdminAuth || !adminUser) {
    return <LoadingScreen />;
  }

  const allowedRoles = getAllowedRoles(pathname || '/admin');
  if (!allowedRoles.includes(adminUser.role)) {
    return <LoadingScreen message="Redirecting to your workspace..." />;
  }

  return children;
}
