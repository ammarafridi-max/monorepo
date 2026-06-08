'use client';

import { BACKEND } from '@/admin/config';

export function useLogout() {
  async function logout() {
    await fetch(`${BACKEND}/api/auth/logout`, {
      method: 'GET',
      credentials: 'include',
    });

    window.location.href = '/admin/login';
  }

  return { logout };
}
