import ItineraryLayout from '@travel-suite/frontend-shared/layouts/ItineraryLayout';
import ItineraryPreviewPage from '@travel-suite/frontend-shared/pages/client/shared/ItineraryPreviewPage';

export const metadata = {
  title: 'Your Itinerary | Travl',
  robots: { index: false, follow: false },
};

export default async function Page({ params }) {
  const { sessionId } = await params;
  return (
    <ItineraryLayout>
      <ItineraryPreviewPage sessionId={sessionId} />
    </ItineraryLayout>
  );
}
