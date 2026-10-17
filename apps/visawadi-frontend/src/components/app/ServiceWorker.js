'use client';

import { useEffect } from 'react';

export default function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;
    const id = setTimeout(() => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }, 2000);
    return () => clearTimeout(id);
  }, []);

  return null;
}
