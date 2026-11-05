import { buildMetadata } from '@/lib/schema';

export const metadata = buildMetadata({
  title: 'Order Confirmed',
  description: 'Your hotel reservation payment has been processed successfully.',
  canonical: 'https://www.dummyticket365.com/hotel-booking/payment',
  robots: { index: false, follow: false },
});

export default function PaymentLayout({ children }) {
  return children;
}
