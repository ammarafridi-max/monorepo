'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { usePathname } from 'next/navigation';
import { Mail, Plane, Rss } from 'lucide-react';
import { CurrencyProvider } from '@travel-suite/frontend-shared/contexts/CurrencyContext';
import { TicketProvider } from '@travel-suite/frontend-shared/contexts/TicketContext';
import { InsuranceProvider } from '@travel-suite/frontend-shared/contexts/InsuranceContext';
import AppLayout from '@travel-suite/frontend-shared/layouts/AppLayout';
import AnalyticsInit from '@travel-suite/frontend-shared/components/shared/AnalyticsInit';

const LOGO_ALT = 'DT365 Logo';
const EMAIL = 'info@dummyticket365.com';

const defaultPages = [
  {
    name: 'Dummy Tickets',
    links: ['/', '/booking/select-flights', '/booking/review-details'],
    icon: <Plane size={18} />,
    subpages: [
      { name: 'Dummy Ticket For Australia Visa', link: '/dummy-ticket-australia-visa' },
      { name: 'Dummy Ticket For Canada Visa', link: '/dummy-ticket-canada-visa' },
      { name: 'Dummy Ticket For Japan Visa', link: '/dummy-ticket-japan-visa' },
      { name: 'Dummy Ticket For Schengen Visa', link: '/dummy-ticket-schengen-visa' },
      { name: 'Dummy Ticket For UK Visa', link: '/dummy-ticket-uk-visa' },
      { name: 'Onward Ticket', link: '/onward-ticket' },
      { name: 'Flight Itinerary', link: '/flight-itinerary' },
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
              <InsuranceProvider>
                <AppLayout pages={flightItineraryPages} logoAlt={LOGO_ALT} email={EMAIL}>
                  <main>{children}</main>
                </AppLayout>
              </InsuranceProvider>
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
            <InsuranceProvider>
              <AppLayout pages={defaultPages} logoAlt={LOGO_ALT} email={EMAIL}>
                <main>{children}</main>
              </AppLayout>
            </InsuranceProvider>
          </TicketProvider>
        </CurrencyProvider>
      </QueryClientProvider>
    </>
  );
}
