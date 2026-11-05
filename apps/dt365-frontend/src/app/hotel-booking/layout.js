import HotelLayout from '@travel-suite/frontend-shared/layouts/HotelLayout';
import { buildMetadata } from '@/lib/schema';

export const metadata = buildMetadata({
  title: 'Hotel Reservation for Visa - Dummy Ticket 365',
  description: 'Get a confirmed hotel reservation for your visa application, delivered by email.',
  canonical: 'https://www.dummyticket365.com/hotel-booking',
});

export default function HotelBookingLayout({ children }) {
  return <HotelLayout>{children}</HotelLayout>;
}
