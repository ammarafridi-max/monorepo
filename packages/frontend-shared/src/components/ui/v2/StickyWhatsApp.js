'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { FaWhatsapp } from 'react-icons/fa';

export default function StickyWhatsApp({
  phoneNumber,
  label = 'Chat with us on WhatsApp',
  hidePathPrefixes = [],
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  // Sits over the hero's bottom-right corner at phone widths, so wait until
  // the first scroll before showing it.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (hidePathPrefixes.some((prefix) => pathname?.startsWith(prefix))) {
    return null;
  }

  if (!phoneNumber || phoneNumber === 'PLACEHOLDER_WHATSAPP_NUMBER') {
    if (typeof window !== 'undefined') {
      console.warn('[StickyWhatsApp] missing phoneNumber — not rendering');
    }
    return null;
  }

  const digits = String(phoneNumber).replace(/\D/g, '');
  const href = `https://wa.me/${digits}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className={`fixed bottom-4 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 ${
        scrolled ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0 md:pointer-events-auto md:translate-y-0 md:opacity-100'
      }`}
    >
      <FaWhatsapp size={28} aria-hidden="true" />
    </a>
  );
}
