import TicketLayout from '@travel-suite/frontend-shared/layouts/TicketLayout';
import { buildMetadata } from '@/lib/schema';

export const metadata = buildMetadata({
  title: 'Booking - Dummy Ticket 365',
  description: 'Complete your dummy ticket booking flow.',
  canonical: 'https://www.dummyticket365.com/booking/select-flights',
  robots: { index: false, follow: false },
});

export default function BookingFlowLayout({ children }) {
  return <TicketLayout>{children}</TicketLayout>;
}
