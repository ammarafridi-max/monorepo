'use client';

import { useState, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { usePathname } from 'next/navigation';
import { Mail, Plane, ShieldPlus, Globe } from 'lucide-react';
import { CurrencyProvider } from '@travel-suite/frontend-shared/contexts/CurrencyContext';
import { TicketProvider } from '@travel-suite/frontend-shared/contexts/TicketContext';
import { InsuranceProvider } from '@travel-suite/frontend-shared/contexts/InsuranceContext';
import AppMegaLayout from '@travel-suite/frontend-shared/layouts/AppMegaLayout';
import AnalyticsInit from '@travel-suite/frontend-shared/components/v1/AnalyticsInit';

const LOGO_ALT = 'Travl Logo';
const EMAIL = 'info@travl.ae';

const defaultPages = [
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
    links: ['/flight-itinerary', '/booking/select-flights', '/booking/review-details'],
    icon: <Plane size={18} />,
  },
  {
    name: 'Visa',
    links: ['/visa'],
    icon: <Globe size={18} />,
    subpages: [
      {
        name: 'All Destinations',
        link: '/visa',
        description: 'Browse all visa services we offer',
      },
      {
        name: 'Schengen Visa',
        link: '/visa/schengen',
        description: 'Access 27 European countries with one visa',
      },
      {
        name: 'United Kingdom Visa',
        link: '/visa/united-kingdom',
        description: 'Tourism, business, and family visits to the UK',
      },
      {
        name: 'US Visa',
        link: '/visa/usa',
        description: 'B1/B2 visitor visa with interview coaching',
      },
      {
        name: 'Canada Visa',
        link: '/visa/canada',
        description: 'Temporary resident visa for tourism and family visits',
      },
    ],
  },
  { name: 'Email Us', links: [`mailto:${EMAIL}`], icon: <Mail size={18} /> },
];

const flightItineraryPages = [
  {
    name: 'Flight Itinerary',
    links: ['/flight-itinerary', '/booking/select-flights', '/booking/review-details'],
    icon: <Plane size={18} />,
  },
  { name: 'Travel Insurance', links: ['/travel-insurance'], icon: <ShieldPlus size={18} /> },
  { name: 'Email Us', links: [`mailto:${EMAIL}`], icon: <Mail size={18} /> },
];

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

  if (pathname?.startsWith('/flight-itinerary')) {
    return (
      <>
        <AnalyticsInit />
        <Toaster />
        <QueryClientProvider client={queryClient}>
          <CurrencyProvider>
            <TicketProvider>
              <Suspense>
                <InsuranceProvider>
                  <AppMegaLayout pages={flightItineraryPages} logoAlt={LOGO_ALT} email={EMAIL}>
                    <main>{children}</main>
                  </AppMegaLayout>
                </InsuranceProvider>
              </Suspense>
            </TicketProvider>
          </CurrencyProvider>
        </QueryClientProvider>
      </>
    );
  }

  return (
    <>
      <AnalyticsInit />
      <Toaster />
      <QueryClientProvider client={queryClient}>
        <CurrencyProvider>
          <TicketProvider>
            <Suspense>
              <InsuranceProvider>
                <AppMegaLayout pages={defaultPages} logoAlt={LOGO_ALT} email={EMAIL}>
                  <main>{children}</main>
                </AppMegaLayout>
              </InsuranceProvider>
            </Suspense>
          </TicketProvider>
        </CurrencyProvider>
      </QueryClientProvider>
    </>
  );
}
