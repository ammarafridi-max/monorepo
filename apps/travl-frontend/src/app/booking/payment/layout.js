import { buildMetadata } from '@/lib/publicMetadata';

export const metadata = buildMetadata({
  title: 'Payment Successful',
  description: 'Your booking payment has been processed successfully.',
  canonical: 'https://www.travl.ae/booking/payment',
  robots: { index: false, follow: false },
});

export default function PaymentLayout({ children }) {
  return children;
}
