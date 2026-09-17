'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initializeGA } from '../../utils/analytics';
import { initializeClarity } from '../../utils/clarity';

export default function AnalyticsInit() {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  useEffect(() => {
    if (isAdminRoute) return undefined;

    // GA4 and Clarity share one idle-time init so every brand gets both from one mount.
    const init = () => {
      initializeGA();
      initializeClarity();
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(init);
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = window.setTimeout(init, 1200);
    return () => window.clearTimeout(timeoutId);
  }, [isAdminRoute]);

  return null;
}
