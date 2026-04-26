import { buildMetadata } from '@/lib/schema';

export const metadata = buildMetadata({
  title: 'Payment Successful',
  description: 'Your booking payment has been processed successfully.',
  canonical: 'https://www.dummyticket365.com/booking/payment',
  robots: { index: false, follow: false },
});

export default function PaymentLayout({ children }) {
  return children;
}
