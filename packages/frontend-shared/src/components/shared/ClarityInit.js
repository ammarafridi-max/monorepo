'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initializeClarity } from '../../utils/clarity';

// Mounted once per app in Providers, next to <AnalyticsInit />. Session recording
// should start as early as possible, so — unlike GA — we don't defer it to
// requestIdleCallback. Prod-only + non-admin is enforced in initializeClarity and
// re-checked here so it stays off on the admin dashboards.
export default function ClarityInit() {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  useEffect(() => {
    if (isAdminRoute) return;
    initializeClarity();
  }, [isAdminRoute]);

  return null;
}
