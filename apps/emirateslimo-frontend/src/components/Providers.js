'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ToastContainer } from 'react-toastify';
import CurrencyProvider from '../context/CurrencyContext';
import BookingProvider from '../context/BookingContext';
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
        <BookingProvider>
          <ScrollToTop />
          {children}
        </BookingProvider>
      </CurrencyProvider>
    </QueryClientProvider>
  );
}
