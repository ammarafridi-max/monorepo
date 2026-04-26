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

const LOGO_ALT = 'MDT Logo';
const EMAIL = 'info@mydummyticket.ae';

const defaultPages = [
  {
    name: 'Dummy Tickets',
    links: ['/', '/booking/select-flights', '/booking/review-details'],
    icon: <Plane size={18} />,
    subpages: [
      { name: 'Dummy Ticket For Schengen Visa', link: '/dummy-ticket-schengen-visa' },
      { name: 'Dummy Ticket For US Visa', link: '/dummy-ticket-us-visa' },
      { name: 'Emirates Dummy Ticket', link: '/emirates-dummy-ticket' },
      { name: 'Etihad Dummy Ticket', link: '/etihad-dummy-ticket' },
      { name: 'Onward Ticket', link: '/onward-ticket' },
      { name: 'Flight Itinerary', link: '/flight-itinerary' },
    ],
  },
  {
    name: 'Travel Insurance',
    links: ['/travel-insurance', '/schengen-travel-insurance'],
    icon: <ShieldPlus size={18} />,
    subpages: [
      { name: 'Travel Insurance for Schengen Visa', link: '/schengen-travel-insurance' },
    ],
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
  { name: 'Travel Insurance', links: ['/schengen-travel-insurance'], icon: <ShieldPlus size={18} /> },
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
