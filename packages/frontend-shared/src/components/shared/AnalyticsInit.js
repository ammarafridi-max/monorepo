'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initializeGA } from '../../utils/analytics';
import { initializeClarity } from '../../utils/clarity';
import { initializeMetaPixel } from '../../utils/pixel';

export default function AnalyticsInit() {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  useEffect(() => {
    if (isAdminRoute) return undefined;

    // GA4, Clarity and the Meta Pixel share one idle-time init so every brand gets all three from one mount.
    const init = () => {
      initializeGA();
      initializeClarity();
      initializeMetaPixel();
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
