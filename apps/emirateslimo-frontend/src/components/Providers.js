'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ToastContainer } from 'react-toastify';
import { CurrencyProvider } from '@travel-suite/frontend-shared/contexts/CurrencyContext';
import { LimoBookingProvider } from '@travel-suite/frontend-shared/contexts/LimoBookingContext';
import ScrollToTop from './ScrollToTop';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 300 * 1000,
    },
  },
});

export default function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <ToastContainer position="top-right" autoClose={3000} />
      <CurrencyProvider>
        <LimoBookingProvider>
          <ScrollToTop />
          {children}
        </LimoBookingProvider>
      </CurrencyProvider>
    </QueryClientProvider>
  );
}
