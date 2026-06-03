import Link from 'next/link';
import { Plane, Mail } from 'lucide-react';
import {
  FaStripe,
  FaCcVisa,
  FaCcMastercard,
  FaApplePay,
  FaGooglePay,
} from 'react-icons/fa';
import Container from '@travel-suite/frontend-shared/components/shared/layout/Container';

const EMAIL = 'info@airportrides.com';

const columns = [
  {
    title: 'Explore',
    links: [
      { name: 'How it works', href: '/#how-it-works' },
      { name: 'Destinations', href: '/#destinations' },
      { name: 'Why us', href: '/#why' },
      { name: 'FAQ', href: '/#faq' },
    ],
  },
  {
    title: 'Company',
    links: [
      { name: 'About', href: '#' },
      { name: 'Become a driver', href: '#' },
      { name: 'Contact', href: `mailto:${EMAIL}` },
    ],
  },
  {
    title: 'Legal',
    links: [
      { name: 'Terms & Conditions', href: '#' },
      { name: 'Privacy Policy', href: '#' },
    ],
  },
];

const paymentIcons = [
  { Icon: FaStripe, key: 'stripe' },
  { Icon: FaCcVisa, key: 'visa' },
  { Icon: FaCcMastercard, key: 'mastercard' },
  { Icon: FaApplePay, key: 'applepay' },
  { Icon: FaGooglePay, key: 'gpay' },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-950 text-gray-400">
      <Container className="py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:pr-6">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white">
                <Plane size={18} />
              </span>
              <span className="text-lg font-bold tracking-tight text-white">
                Airport<span className="text-primary-400">Rides</span>
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm font-light leading-relaxed">
              Pre-booked airport transfers in over 40 cities worldwide. Fixed
              prices, professional drivers, no surge, no surprises.
            </p>
            <a
              href={`mailto:${EMAIL}`}
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-gray-300 transition-colors hover:text-white"
            >
              <Mail size={16} />
              {EMAIL}
            </a>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l.name}>
                    {l.href.startsWith('mailto:') ? (
                      <a
                        href={l.href}
                        className="text-sm font-light transition-colors hover:text-white"
                      >
                        {l.name}
                      </a>
                    ) : (
                      <Link
                        href={l.href}
                        className="text-sm font-light transition-colors hover:text-white"
                      >
                        {l.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-6 border-t border-white/10 pt-6 md:flex-row">
          <p className="text-[13px] text-gray-500">
            © {year} <span className="font-medium text-gray-300">AirportRides</span>. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-3xl text-gray-500">
            {paymentIcons.map(({ Icon, key }) => (
              <Icon key={key} className="transition-colors hover:text-gray-300" />
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
}
