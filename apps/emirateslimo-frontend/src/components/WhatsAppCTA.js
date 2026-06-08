'use client';
import { usePathname } from 'next/navigation';
import { FaWhatsapp } from 'react-icons/fa6';

const whatsappUrl =
  'https://wa.me/971569964924?text=Hi%20Emirates%20Limo,%20I%20need%20assistance%20with%20booking%20a%20chauffeur.';

export default function WhatsAppCTA() {
  const pathname = usePathname();
  const isBookingPage = pathname?.startsWith('/book') || pathname === '/payment';

  if (isBookingPage) return null;

  return (
    <div className="fixed bottom-10 right-10 lg:bottom-15 lg:right-15 z-[1000]">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 bg-green-500 text-white py-2.5 px-5 rounded-full font-light shadow-lg cursor-pointer duration-300 hover:bg-green-600"
      >
        <FaWhatsapp />
        <span className="text-sm">Chat with us</span>
      </a>
    </div>
  );
}
