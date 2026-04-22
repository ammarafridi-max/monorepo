'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initializeGA } from '../../utils/analytics';

export default function AnalyticsInit() {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  useEffect(() => {
    if (isAdminRoute) return undefined;

    const init = () => initializeGA();

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(init);
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = window.setTimeout(init, 1200);
    return () => window.clearTimeout(timeoutId);
  }, [isAdminRoute]);

  return null;
}
