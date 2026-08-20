'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '../../contexts/AdminAuthContext.js';

export function useAdminLogout() {
  const router = useRouter();
  const { setAdminUser } = useAdminAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL ?? ''}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      void 0;
    } finally {
      setAdminUser(null);
      router.push('/admin/login');
      router.refresh();
    }
  }

  return { logout, loggingOut };
}
