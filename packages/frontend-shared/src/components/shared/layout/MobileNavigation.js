'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useRef, useState } from 'react';
import { useOutsideClick } from '../../../hooks/general/useOutsideClick';
import { defaultPages as travlDefaultPages } from './Navigation';
import { HiOutlineEnvelope, HiOutlineXMark } from 'react-icons/hi2';
import { CgMenuRightAlt } from 'react-icons/cg';
import { ChevronDown, ChevronRight } from 'lucide-react';
import Container from './Container';
import Currency from '../flight/Currency';

export default function MobileNavigation({ pages = travlDefaultPages, logoAlt = 'Logo' }) {
  const pathname = usePathname();
  const wrapperRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);

  useOutsideClick(wrapperRef, () => setMenuOpen(false));

  return (
    <nav className="block lg:hidden absolute top-0 left-0 right-0 z-9999 bg-transparent py-3">
      <Container className="flex justify-between items-center">
        <Link href="/" className="w-30 h-auto flex items-center">
          <Image
            src="/logo.webp"
            alt={logoAlt}
            width={100}
            height={10}
            priority
            className="w-full h-auto object-contain"
          />
        </Link>

        <div className="flex items-center gap-2">
          <Currency />
          <div
            onClick={() => setMenuOpen((prev) => !prev)}
            className="rounded-xl cursor-pointer transition-colors"
          >
            {menuOpen ? (
              <HiOutlineXMark className="text-2xl" />
            ) : (
              <CgMenuRightAlt className="text-2xl" />
            )}
          </div>
        </div>
      </Container>

      {menuOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-9998" />
          <div className="fixed inset-0 z-9999 flex">
            <div
              ref={wrapperRef}
              className="w-[82%] max-w-[360px] h-dvh bg-white shadow-2xl border-r border-gray-200 px-5 pt-5"
            >
              <div className="mb-5 pb-4 border-b border-gray-100">
                <p className="text-xs uppercase tracking-[0.14em] text-primary-600 font-semibold">
                  Menu
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Find tickets, insurance, and support.
                </p>
              </div>

              {pages.map((page, i) => {
                if (page.subpages) {
                  return (
                    <div key={i}>
                      <div
                        className="flex items-center justify-between px-3 py-2.5 text-[15px] font-medium text-gray-800 hover:bg-gray-100 rounded-xl"
                        onClick={() => setOpenIndex(openIndex === i ? null : i)}
                      >
                        <div className="flex items-center gap-3">
                          {page.icon}
                          <span>{page.name}</span>
                        </div>
                        {openIndex === i ? (
                          <ChevronDown size={20} />
                        ) : (
                          <ChevronRight size={20} />
                        )}
                      </div>

                      {openIndex === i && (
                        <div className="mt-1 mb-2 flex flex-col rounded-xl bg-gray-50 p-1.5">
                          {page.subpages.map((sub, idx) => (
                            <Link
                              key={idx}
                              href={sub.link}
                              onClick={() => setMenuOpen(false)}
                              className="px-6 py-2.5 font-medium text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={i}
                    href={page.links[0]}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 text-[15px] font-medium rounded-xl transition ${
                      page.links.includes(pathname)
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      {page.icon}
                      {page.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
