'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initializeHotjar } from '../../utils/hotjar';

export default function HotjarInit() {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  useEffect(() => {
    if (isAdminRoute) return;
    initializeHotjar();
  }, [isAdminRoute]);

  return null;
}
