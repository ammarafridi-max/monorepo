'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Mail, Plane, Rss, ShieldPlus } from 'lucide-react';
import Container from './Container';
import Currency from '../flight/Currency';

export const defaultPages = [
  {
    name: 'Travel Insurance',
    links: ['/travel-insurance'],
    icon: <ShieldPlus size={18} />,
    subpages: [
      { name: 'Travel Insurance', link: '/travel-insurance' },
      { name: 'Schengen Visa Insurance', link: '/travel-insurance/schengen-visa' },
      { name: 'Travel Medical Insurance', link: '/travel-insurance/medical' },
      { name: 'Annual Multi-Trip Insurance', link: '/travel-insurance/annual-multi-trip' },
      { name: 'International Travel Insurance', link: '/travel-insurance/international' },
      { name: 'Single Trip Insurance', link: '/travel-insurance/single-trip' },
    ],
  },
  {
    name: 'Flight Itinerary',
    links: ['/flight-itinerary', '/booking/review-details'],
    icon: <Plane size={18} />,
  },
  { name: 'Blog', links: ['/blog'], icon: <Rss size={18} /> },
  // Note: an "Email Us" entry is intentionally NOT included in the default
  // pages array — it would otherwise leak a brand email across all consumers.
  // Each app should append its own { name: 'Email Us', links: [`mailto:${brandEmail}`], icon: <Mail/> }.
];

export default function Navigation({ pages = defaultPages, logoAlt = 'Logo' }) {
  const pathname = usePathname();

  return (
    <header className="hidden lg:block absolute top-0 left-0 right-0 z-50 bg-transparent">
      <Container>
        <nav className="flex items-center justify-between py-3 font-outfit">
          <div className="w-40 shrink-0">
            <Link href="/" className="block">
              <Image
                src="/logo.webp"
                alt={logoAlt}
                title={logoAlt}
                width={224}
                height={60}
                priority
                className="w-full h-auto object-contain"
                style={{ height: 'auto' }}
              />
            </Link>
          </div>

          <div className="flex items-center gap-1 rounded-2xl bg-transparent p-1">
            {pages.map((page, i) => (
              <div key={i} className="relative group">
                <Link
                  href={page.links[0]}
                  title={page.name}
                  className={`flex items-center gap-1.5 text-[14px] font-medium py-2 px-3 capitalize transition-all duration-300 rounded-xl ${
                    page.links.includes(pathname)
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700'
                  }`}
                >
                  {page.icon && <span className="text-sm">{page.icon}</span>}
                  <span>{page.name}</span>
                  <span>{page.subpages ? <ChevronDown size={18} /> : ''}</span>
                </Link>

                {page?.subpages && (
                  <div className="hidden group-hover:flex flex-col w-72 absolute top-10 left-0 bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden z-60 p-2">
                    {page.subpages.map((subpage, j) => (
                      <Link
                        key={j}
                        href={subpage.link}
                        className="text-[14px] font-medium text-gray-600 hover:text-gray-900 px-3 py-2.5 hover:bg-gray-100 rounded-xl"
                      >
                        {subpage.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="ml-2 pl-2 border-l">
              <Currency />
            </div>
          </div>
        </nav>
      </Container>
    </header>
  );
}
