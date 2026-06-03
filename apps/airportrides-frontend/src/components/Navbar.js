'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plane, Menu, X } from 'lucide-react';
import Container from '@travel-suite/frontend-shared/components/shared/layout/Container';

const navLinks = [
  { name: 'How it works', href: '/#how-it-works' },
  { name: 'Destinations', href: '/#destinations' },
  { name: 'Why us', href: '/#why' },
  { name: 'FAQ', href: '/#faq' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-gray-100 bg-white">
      <Container>
        <nav className="flex items-center justify-between py-3.5">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white">
              <Plane size={18} />
            </span>
            <span className="text-lg font-bold tracking-tight text-gray-900">
              Airport<span className="text-primary-600">Rides</span>
            </span>
          </Link>

          <div className="hidden items-center gap-1 lg:flex">
            {navLinks.map((l) => (
              <Link
                key={l.name}
                href={l.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-primary-600"
              >
                {l.name}
              </Link>
            ))}
          </div>

          <div className="hidden lg:block">
            <Link
              href="/#book"
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
            >
              Find your transfer
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={open}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 lg:hidden"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>
      </Container>

      {open && (
        <div className="border-t border-gray-100 bg-white lg:hidden">
          <Container>
            <div className="flex flex-col gap-1 py-3">
              {navLinks.map((l) => (
                <Link
                  key={l.name}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-2 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {l.name}
                </Link>
              ))}
              <Link
                href="/#book"
                onClick={() => setOpen(false)}
                className="mt-2 rounded-lg bg-gray-900 px-4 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-gray-800"
              >
                Find your transfer
              </Link>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
