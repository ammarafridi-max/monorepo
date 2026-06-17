import { pixelEvent } from '@travel-suite/frontend-shared/utils/pixel';

const isProduction = process.env.NODE_ENV === 'production';

// Emirates Limo gates Meta Pixel on production; shared pixelEvent handles the fbq plumbing.
const canTrack = () => isProduction && typeof window !== 'undefined' && !!window.fbq;

export const trackLimoFormSubmissionMeta = ({ tripType }) => {
  if (!canTrack()) return;
  pixelEvent('Lead', {
    content_category: 'Chauffeur Service',
    trip_type: tripType,
  });
};

export const trackVehicleSelectionMeta = ({ id, brand, model }) => {
  if (!canTrack()) return;
  pixelEvent('ViewContent', {
    content_ids: [id],
    content_name: `${brand} ${model}`,
    content_type: 'vehicle',
  });
};

export const trackBeginCheckoutMeta = ({ currency, value }) => {
  if (!canTrack()) return;
  pixelEvent('InitiateCheckout', { currency, value });
};

export const trackPurchaseEventMeta = ({ currency, value, transactionId }) => {
  if (!canTrack()) return;
  pixelEvent('Purchase', { currency, value, transaction_id: transactionId });
};

export function trackEvent(event, data = {}) {
  if (!canTrack()) return;
  pixelEvent(event, data);
}
