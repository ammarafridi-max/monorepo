import Link from 'next/link';
import Container from './Container';
import { ChevronDown } from 'lucide-react';

export const pages = [
  {
    name: 'Airport Transfers',
    link: '/dubai-airport-transfer',
    subpages: [
      { name: 'Dubai Airport Transfer', link: '/dubai-airport-transfer' },
      { name: 'Abu Dhabi Airport Transfer', link: '/abu-dhabi-airport-transfer' },
    ],
  },
  {
    name: 'Chauffeur',
    link: '/chauffeur-service',
    subpages: [
      { name: 'Chauffeur Service', link: '/chauffeur-service' },
      { name: 'Abu Dhabi Chauffeur Service', link: '/chauffeur-service-abu-dhabi' },
      { name: 'Hourly Chauffeur', link: '/hourly-chauffeur' },
      { name: 'Car Hire With Driver Dubai', link: '/car-hire-with-driver-dubai' },
    ],
  },
  {
    name: 'Transfers',
    link: '/dubai-transfer',
    subpages: [
      { name: 'Dubai Transfer', link: '/dubai-transfer' },
      { name: 'Abu Dhabi to Dubai Transfer', link: '/abu-dhabi-to-dubai-transfer' },
      { name: 'Dubai to Abu Dhabi Transfer', link: '/dubai-to-abu-dhabi-transfer' },
    ],
  },
  {
    name: 'Emirates Limo',
    link: '/about-us',
    subpages: [
      { name: 'About Us', link: '/about-us' },
      { name: 'Contact Us', link: '/contact-us' },
      { name: 'FAQs', link: '/frequently-asked-questions' },
      { name: 'Services', link: '/services' },
      { name: 'Fleet', link: '/fleet' },
      { name: 'Blog', link: '/blog' },
    ],
  },
];

export default function Navigation() {
  return (
    <nav className="hidden lg:block w-full z-50 bg-primary-900 border-b border-white/5">
      <Container>
        <div className="flex items-center justify-between py-3.5">
          <div className="w-38">
            <Link href="/" className="flex items-center">
              <img src="/logo-dark.webp" alt="Emirates Limo" className="w-full object-contain" />
            </Link>
          </div>

          <div className="flex items-center gap-1">
            {pages.map((page, i) => (
              <div key={i} className="relative group">
                <Link
                  href={page.link}
                  title={page.name}
                  className="relative flex items-center gap-1 text-[14.5px] font-light text-white/70 hover:text-white py-3 px-3.5 capitalize transition-colors duration-300 group"
                >
                  <span>{page.name}</span>
                  {page.subpages && (
                    <ChevronDown
                      size={14}
                      className="text-white/40 group-hover:text-white/70 transition-colors mt-px"
                    />
                  )}
                  <span className="absolute bottom-2 left-3.5 right-3.5 h-px bg-accent-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                </Link>

                {page?.subpages && (
                  <div className="hidden group-hover:flex flex-col w-68 absolute top-full right-0 bg-primary-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                    {page.subpages.map((subpage, j) => (
                      <Link
                        key={j}
                        href={subpage.link}
                        className="text-[14px] font-light text-white/60 px-5 py-3 hover:bg-white/5 hover:text-white border-b border-white/5 last:border-0 transition-colors duration-200"
                      >
                        {subpage.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <a
            href="/book/select-limo"
            className="ml-4 inline-flex items-center gap-2 bg-white hover:bg-gray-300 text-black text-[13.5px] font-light tracking-wide py-2.5 px-5 rounded-lg transition-colors duration-300"
          >
            Book a Ride
          </a>
        </div>
      </Container>
    </nav>
  );
}
