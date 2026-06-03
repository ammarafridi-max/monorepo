'use client';

import { usePathname } from 'next/navigation';
import { FaWhatsapp } from 'react-icons/fa';

/**
 * Floating WhatsApp button, bottom-right, sitewide.
 *
 * @param {object}   props
 * @param {string}   props.phoneNumber       E.g. "+971569964924". Non-digits are stripped for wa.me.
 * @param {string}  [props.label]            Accessible label (also the link's title).
 * @param {string[]}[props.hidePathPrefixes] Path prefixes where the bubble must not render
 *                                           (e.g. ["/insurance-booking"] to avoid colliding with
 *                                           the fixed booking footer CTA).
 */
export default function StickyWhatsApp({
  phoneNumber,
  label = 'Chat with us on WhatsApp',
  hidePathPrefixes = [],
}) {
  const pathname = usePathname();

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
      className="fixed bottom-4 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg hover:scale-105 active:scale-95 transition-transform"
    >
      <FaWhatsapp size={28} aria-hidden="true" />
    </a>
  );
}
