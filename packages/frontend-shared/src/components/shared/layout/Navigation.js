'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Mail, Plane, Rss, ShieldPlus } from 'lucide-react';
import Container from './Container';
import Currency from '../flight/Currency';
import BrandMark from './BrandMark';

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

];

export default function Navigation({ pages = defaultPages, logoAlt = 'Logo', onDark = false, logoSrc, logoSrcOnDark, brandName }) {
  const pathname = usePathname();

  return (
    <header className="hidden lg:block absolute top-0 left-0 right-0 z-50 bg-transparent">
      <Container>
        <nav className="relative flex items-center justify-between py-3 font-outfit">
          {brandName ? (
            <BrandMark
              logoSrc={logoSrc}
              logoSrcOnDark={logoSrcOnDark}
              brandName={brandName}
              logoAlt={logoAlt}
              onDark={onDark}
              size={36}
              priority
              className="shrink-0"
            />
          ) : (
            <div className="w-40 shrink-0">
              <Link href="/" className="block">
                <Image
                  src="/logo.webp"
                  alt={logoAlt}
                  title={logoAlt}
                  width={224}
                  height={60}
                  priority
                  style={{ height: 'auto' }}
                  className={`w-full h-auto object-contain ${onDark ? 'brightness-0 invert' : ''}`}
                />
              </Link>
            </div>
          )}

          <div className="flex items-center gap-1 rounded-2xl bg-transparent p-1">
            {pages.map((page, i) => (
              <div key={i} className={`group ${page.columns ? "" : "relative"}`}>
                <Link
                  href={page.links[0]}
                  title={page.name}
                  className={`flex items-center gap-1.5 text-[14px] font-medium py-2 px-3 capitalize transition-all duration-300 rounded-xl ${
                    page.links.includes(pathname)
                      ? onDark
                        ? 'bg-white/15 text-white'
                        : 'bg-primary-100 text-primary-700'
                      : onDark
                        ? 'text-white/85 hover:text-white'
                        : 'text-gray-700'
                  }`}
                >
                  {page.icon && <span className="text-sm">{page.icon}</span>}
                  <span>{page.name}</span>
                  <span>{page.subpages || page.columns ? <ChevronDown size={18} /> : ''}</span>
                </Link>

                {page?.columns && (
                  <div className="hidden group-hover:block group-focus-within:block absolute top-full right-0 w-[860px] max-w-full -mt-4 pt-1 z-60">
                    <div className="grid grid-cols-4 gap-x-6 gap-y-1 bg-white rounded-2xl border border-gray-200 shadow-xl p-6">
                      {page.columns.map((column, c) => (
                        <div key={c}>
                          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                            {column.title}
                          </p>
                          <div className="flex flex-col">
                            {column.links.map((item, k) => (
                              <Link
                                key={k}
                                href={item.link}
                                className="text-[13.5px] leading-5 font-medium text-gray-600 hover:text-primary-700 hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-colors"
                              >
                                {item.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {page?.subpages && (
                  <div className="hidden group-hover:flex group-focus-within:flex flex-col w-72 absolute top-10 left-0 bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden z-60 p-2">
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
            <div className={`ml-2 pl-2 border-l ${onDark ? 'border-white/20' : ''}`}>
              <Currency onDark={onDark} />
            </div>
          </div>
        </nav>
      </Container>
    </header>
  );
}
