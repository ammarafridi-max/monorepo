'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initializeClarity } from '../../utils/clarity';

export default function ClarityInit() {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  useEffect(() => {
    if (isAdminRoute) return;
    initializeClarity();
  }, [isAdminRoute]);

  return null;
}
