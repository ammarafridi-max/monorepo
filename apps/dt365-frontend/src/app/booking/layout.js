import BookingLayout from '@/layouts/BookingLayout';
import { buildMetadata } from '@/lib/publicMetadata';

export const metadata = buildMetadata({
  title: 'Booking - Dummy Ticket 365',
  description: 'Complete your dummy ticket booking flow.',
  canonical: 'https://www.dummyticket365.com/booking/select-flights',
  robots: { index: false, follow: false },
});

export default function BookingFlowLayout({ children }) {
  return <BookingLayout>{children}</BookingLayout>;
}
