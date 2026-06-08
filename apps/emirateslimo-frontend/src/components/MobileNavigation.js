'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { pages } from './Navigation';
import { HiOutlineXMark, HiOutlineBars3 } from 'react-icons/hi2';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useOutsideClick } from '../hooks/general/useOutsideClick';
import Container from './Container';

export default function MobileNavigation() {
  const wrapperRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);

  useOutsideClick(wrapperRef, () => setMenuOpen(false));

  return (
    <nav className="block lg:hidden py-3.5 relative z-50 bg-primary-900 border-b border-white/5">
      <Container className="flex justify-between items-center">
        <Link href="/" className="w-33 h-auto flex items-center">
          <img
            src="/logo-dark.webp"
            alt="Emirates Limo Logo"
            title="Emirates Limo Logo"
            className="w-full h-auto object-contain"
          />
        </Link>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors duration-200"
          aria-label="Toggle menu"
        >
          {menuOpen ? <HiOutlineXMark className="text-xl" /> : <HiOutlineBars3 className="text-xl" />}
        </button>
      </Container>

      {menuOpen && (
        <>
          <div className="fixed inset-0 bg-black/70 z-40" onClick={() => setMenuOpen(false)} />

          <div className="fixed inset-0 z-50 flex items-start justify-start">
            <div ref={wrapperRef} className="w-[82%] max-w-sm h-dvh bg-primary-900 border-r border-white/10 flex flex-col overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
                <img src="/logo-dark.webp" alt="Emirates Limo" className="w-32 h-auto object-contain" />
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <HiOutlineXMark className="text-xl" />
                </button>
              </div>

              <div className="flex flex-col py-3">
                {pages.map((page, i) => {
                  if (page.subpages) {
                    return (
                      <div key={i}>
                        <button
                          className="w-full flex items-center justify-between px-6 py-3.5 text-[15px] font-light text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                          onClick={() => setOpenIndex(openIndex === i ? null : i)}
                        >
                          <span>{page.name}</span>
                          {openIndex === i ? (
                            <ChevronDown size={16} className="text-accent-500" />
                          ) : (
                            <ChevronRight size={16} className="text-white/30" />
                          )}
                        </button>

                        {openIndex === i && (
                          <div className="flex flex-col bg-black/20 border-y border-white/5">
                            {page.subpages.map((sub, idx) => (
                              <Link
                                key={idx}
                                href={sub.link}
                                onClick={() => setMenuOpen(false)}
                                className="pl-10 pr-6 py-3 text-[14px] font-light text-white/50 hover:text-white hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
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
                      href={page.link}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between px-6 py-3.5 text-[15px] font-light text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <span>{page.name}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="mt-auto px-6 pb-8 pt-4 border-t border-white/10">
                <a
                  href="/book/select-limo"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full bg-accent-500 hover:bg-accent-600 text-white text-[14px] font-light tracking-wide py-3 px-5 rounded-lg transition-colors duration-300"
                >
                  Book a Ride
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
