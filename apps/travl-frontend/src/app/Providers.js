'use client';

import { useState, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { usePathname } from 'next/navigation';
import { CurrencyProvider } from '@travel-suite/frontend-shared/contexts/CurrencyContext';
import { TicketProvider } from '@travel-suite/frontend-shared/contexts/TicketContext';
import { InsuranceProvider } from '@travel-suite/frontend-shared/contexts/InsuranceContext';
import AppLayout from '@/layouts/AppLayout';
import AnalyticsInit from '@travel-suite/frontend-shared/components/v1/AnalyticsInit';

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

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      {isAdminRoute ? (
        children
      ) : (
        <>
          <AnalyticsInit />
          <CurrencyProvider>
            <TicketProvider>
              <Suspense>
                <InsuranceProvider>
                  <AppLayout>
                    <main>{children}</main>
                  </AppLayout>
                </InsuranceProvider>
              </Suspense>
            </TicketProvider>
          </CurrencyProvider>
        </>
      )}
    </QueryClientProvider>
  );
}
