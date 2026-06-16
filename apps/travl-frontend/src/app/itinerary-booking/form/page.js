import { countryCodes } from '@/data/countryCodes';
import ItineraryLayout from '@travel-suite/frontend-shared/layouts/ItineraryLayout';
import ItineraryGeneratorPage from '@travel-suite/frontend-shared/pages/client/shared/ItineraryGeneratorPage';

export const metadata = {
  title: 'Create Your Travel Itinerary | Travl',
  description:
    'Enter your trip details and generate an embassy-ready, day-by-day travel itinerary for your visa application.',
  alternates: { canonical: 'https://www.travl.ae/itinerary-booking/form' },
  // Funnel step — the SEO entry points are the /travel-itinerary landing pages.
  robots: { index: false, follow: false },
};

const countries = countryCodes.map((c) => c.country);

export default function Page() {
  return (
    <ItineraryLayout>
      <ItineraryGeneratorPage countries={countries} />
    </ItineraryLayout>
  );
}
