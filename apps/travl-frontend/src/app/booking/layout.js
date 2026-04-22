import BookingLayout from '@/layouts/BookingLayout';
import { buildMetadata } from '@/lib/publicMetadata';

export const metadata = buildMetadata({
  title: 'Booking - Travl',
  description: 'Complete your flight reservation booking.',
  canonical: 'https://www.travl.ae/booking/select-flights',
  robots: { index: false, follow: false },
});

export default function BookingFlowLayout({ children }) {
  return <BookingLayout>{children}</BookingLayout>;
}
