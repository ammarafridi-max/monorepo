'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { usePathname } from 'next/navigation';
import {
  Mail, Plane, ShieldPlus, Globe,
  CalendarDays, HeartPulse, Stethoscope, MapPin, Users,
} from 'lucide-react';
import { UserAuthContext } from '@travel-suite/frontend-shared/contexts/AuthContextBase';
import { CurrencyProvider } from '@travel-suite/frontend-shared/contexts/CurrencyContext';
import { InsuranceProvider } from '@travel-suite/frontend-shared/contexts/InsuranceContext';
import AppMegaLayout from '@travel-suite/frontend-shared/layouts/AppMegaLayout';
import AnalyticsInit from '@travel-suite/frontend-shared/components/shared/AnalyticsInit';

const LOGO_ALT = 'Travl';
const EMAIL = 'info@travl.ae';

const defaultPages = [
  {
    name: 'Travel Insurance',
    links: ['/travel-insurance'],
    mega: {
      columns: [
        {
          heading: 'By Trip Type',
          items: [
            { Icon: ShieldPlus,    label: 'All Plans',              desc: 'Browse every insurance plan we offer',          href: '/travel-insurance' },
            { Icon: Plane,         label: 'Schengen Visa',          desc: 'EUR 30,000 cover, VFS & BLS accepted',          href: '/travel-insurance/schengen-visa' },
            { Icon: CalendarDays,  label: 'Annual Multi-Trip',      desc: 'One policy covering all trips for 12 months',   href: '/travel-insurance/annual-multi-trip' },
            { Icon: HeartPulse,    label: 'Single Trip',            desc: 'Pay only for the days you travel',              href: '/travel-insurance/single-trip' },
          ],
        },
        {
          heading: 'By Coverage',
          items: [
            { Icon: Stethoscope,   label: 'Travel Medical',         desc: 'Emergency treatment & hospitalisation cover',   href: '/travel-insurance/medical' },
            { Icon: Globe,         label: 'International',          desc: 'Worldwide coverage from EUR 80,000',            href: '/travel-insurance/international' },
          ],
        },
      ],
      cta: {
        eyebrow: 'Not sure what you need?',
        title: "Answer 3 quick questions and we'll recommend a plan.",
        href: '/insurance-booking/quote',
        label: 'Find my plan',
      },
    },
  },
  {
    name: 'Visa',
    links: ['/visa'],
    mega: {
      columns: [
        {
          heading: 'By Destination',
          items: [
            { Icon: Globe,   label: 'All Destinations',    desc: 'Browse all visa services we offer',                  href: '/visa' },
            { Icon: MapPin,  label: 'Schengen Visa',       desc: 'Access 27 European countries with one visa',         href: '/visa/schengen' },
            { Icon: MapPin,  label: 'United Kingdom',      desc: 'Tourism, business, and family visits to the UK',     href: '/visa/united-kingdom' },
            { Icon: MapPin,  label: 'United States',       desc: 'B1/B2 visitor visa with interview coaching',         href: '/visa/usa' },
            { Icon: MapPin,  label: 'Canada',              desc: 'Temporary resident visa for tourism and family',     href: '/visa/canada' },
          ],
        },
      ],
    },
  },
  { name: 'Email Us', links: [`mailto:${EMAIL}`] },
];

const GUEST_AUTH = { user: null, isAuthenticated: false, isLoadingAuth: false, setUser: () => {}, refreshUser: async () => {} };

function GuestAuthProvider({ children }) {
  return <UserAuthContext.Provider value={GUEST_AUTH}>{children}</UserAuthContext.Provider>;
}

export default function Providers({ children }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 300 * 1000,
          },
        },
      }),
  );

  if (isAdminRoute) {
    return (
      <>
        <Toaster />
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </>
    );
  }

  return (
    <>
      <AnalyticsInit />
      <Toaster />
      <QueryClientProvider client={queryClient}>
        <GuestAuthProvider>
          <CurrencyProvider>
            <InsuranceProvider>
              <AppMegaLayout pages={defaultPages} logoAlt={LOGO_ALT}>
                <main>{children}</main>
              </AppMegaLayout>
            </InsuranceProvider>
          </CurrencyProvider>
        </GuestAuthProvider>
      </QueryClientProvider>
    </>
  );
}
