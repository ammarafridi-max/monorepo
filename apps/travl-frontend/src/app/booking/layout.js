import TicketLayout from '@travel-suite/frontend-shared/layouts/TicketLayout';
import { buildMetadata } from '@/lib/schema';

export const metadata = buildMetadata({
  title: 'Booking - Travl',
  description: 'Complete your flight reservation booking.',
  canonical: 'https://www.travl.ae/booking/select-flights',
  robots: { index: false, follow: false },
});

export default function BookingFlowLayout({ children }) {
  return <TicketLayout>{children}</TicketLayout>;
}
