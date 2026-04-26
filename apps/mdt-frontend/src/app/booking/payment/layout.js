import { buildMetadata } from '@/lib/schema';

export const metadata = buildMetadata({
  title: 'Payment Successful',
  description: 'Your booking payment has been processed successfully.',
  canonical: 'https://www.mydummyticket.ae/booking/payment',
  robots: { index: false, follow: false },
});

export default function PaymentLayout({ children }) {
  return children;
}
