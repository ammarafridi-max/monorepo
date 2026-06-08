import BookingDetailsClient from './BookingDetailsClient';

export const metadata = {
  title: 'Booking Details | Emirates Limo Dubai',
  description: 'Confirm your Emirates Limo booking details for your Dubai chauffeur or airport transfer service.',
  robots: 'noindex, nofollow',
  alternates: {
    canonical: 'https://www.emirateslimo.com/book/booking-details',
  },
};

export default function BookingDetailsPage() {
  return <BookingDetailsClient />;
}
