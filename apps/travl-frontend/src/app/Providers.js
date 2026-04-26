'use client';

import { useState, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { usePathname } from 'next/navigation';
import { Mail, Plane, Rss, ShieldPlus } from 'lucide-react';
import { CurrencyProvider } from '@travel-suite/frontend-shared/contexts/CurrencyContext';
import { TicketProvider } from '@travel-suite/frontend-shared/contexts/TicketContext';
import { InsuranceProvider } from '@travel-suite/frontend-shared/contexts/InsuranceContext';
import AppLayout from '@travel-suite/frontend-shared/layouts/AppLayout';
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
  { name: 'Blog', links: ['/blog'], icon: <Rss size={18} /> },
  { name: 'Email Us', links: [`mailto:${EMAIL}`], icon: <Mail size={18} /> },
];

const flightItineraryPages = [
  {
    name: 'Flight Itinerary',
    links: ['/flight-itinerary', '/booking/select-flights', '/booking/review-details'],
    icon: <Plane size={18} />,
  },
  { name: 'Travel Insurance', links: ['/travel-insurance'], icon: <ShieldPlus size={18} /> },
  { name: 'Blog', links: ['/blog'], icon: <Rss size={18} /> },
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
                  <AppLayout pages={flightItineraryPages} logoAlt={LOGO_ALT} email={EMAIL}>
                    <main>{children}</main>
                  </AppLayout>
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
                <AppLayout pages={defaultPages} logoAlt={LOGO_ALT} email={EMAIL}>
                  <main>{children}</main>
                </AppLayout>
              </InsuranceProvider>
            </Suspense>
          </TicketProvider>
        </CurrencyProvider>
      </QueryClientProvider>
    </>
  );
}
