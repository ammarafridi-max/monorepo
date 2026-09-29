'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initializeGA } from '../../utils/analytics';
import { initializeClarity } from '../../utils/clarity';
import { initializeMetaPixel } from '../../utils/pixel';
import { initializeOpenAIPixel } from '../../utils/openaiPixel';
import { captureAttribution } from '../../utils/attribution';

export default function AnalyticsInit({ enabled = true }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  useEffect(() => {
    if (!enabled || isAdminRoute) return undefined;

    captureAttribution();

    // Every analytics and ad pixel shares one idle-time init so a brand gets them all from one mount.
    const init = () => {
      initializeGA();
      initializeClarity();
      initializeMetaPixel();
      initializeOpenAIPixel();
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(init);
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = window.setTimeout(init, 1200);
    return () => window.clearTimeout(timeoutId);
  }, [enabled, isAdminRoute]);

  return null;
}
