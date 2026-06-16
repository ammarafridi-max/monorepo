import ItineraryLayout from '@travel-suite/frontend-shared/layouts/ItineraryLayout';
import ItinerarySuccessPage from '@travel-suite/frontend-shared/pages/client/shared/ItinerarySuccessPage';

export const metadata = {
  title: 'Itinerary Ready | Travl',
  robots: { index: false, follow: false },
};

export default async function Page({ params }) {
  const { sessionId } = await params;
  return (
    <ItineraryLayout>
      <ItinerarySuccessPage sessionId={sessionId} />
    </ItineraryLayout>
  );
}
