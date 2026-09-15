'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { FaWhatsapp } from 'react-icons/fa6';

export const WHATSAPP_URL =
  'https://wa.me/971569964924?text=Hi%20Emirates%20Limo,%20I%20need%20assistance%20with%20booking%20a%20chauffeur.';

export default function WhatsAppCTA() {
  const pathname = usePathname();
  const [fieldFocused, setFieldFocused] = useState(false);
  const isBookingPage = pathname?.startsWith('/book') || pathname === '/payment';

  // The pill sits over the hero form's last field on small screens, so step aside while someone is typing.
  useEffect(() => {
    const isField = (el) => el && ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
    const onFocusIn = (e) => isField(e.target) && setFieldFocused(true);
    const onFocusOut = () => setFieldFocused(false);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  if (isBookingPage) return null;

  return (
    <div
      className={`fixed bottom-5 right-5 lg:bottom-15 lg:right-15 z-[1000] transition-opacity duration-200 ${
        fieldFocused ? 'opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto' : ''
      }`}
    >
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Emirates Limo on WhatsApp"
        className="flex items-center justify-center gap-2 bg-green-500 text-white w-12 h-12 lg:w-auto lg:h-auto lg:py-2.5 lg:px-5 rounded-full font-light shadow-lg cursor-pointer duration-300 hover:bg-green-600"
      >
        <FaWhatsapp className="text-[22px] lg:text-base" />
        <span className="hidden lg:inline text-sm">Chat with us</span>
      </a>
    </div>
  );
}
