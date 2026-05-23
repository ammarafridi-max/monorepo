'use client';

import { useState, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { usePathname } from 'next/navigation';
import { Plane } from 'lucide-react';
import { CurrencyProvider } from '@travel-suite/frontend-shared/contexts/CurrencyContext';
import { TicketProvider } from '@travel-suite/frontend-shared/contexts/TicketContext';
import { InsuranceProvider } from '@travel-suite/frontend-shared/contexts/InsuranceContext';
import AppLayout from '@travel-suite/frontend-shared/layouts/AppLayout';
import AnalyticsInit from '@travel-suite/frontend-shared/components/shared/AnalyticsInit';

const LOGO_ALT = 'AirportRides Logo';
const EMAIL = 'info@airportrides.com';

const defaultPages = [
  { name: 'Home', links: ['/'], icon: <Plane size={18} /> },
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
