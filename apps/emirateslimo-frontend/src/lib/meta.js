const isProduction = process.env.NODE_ENV === 'production';

const canTrack = () => {
  return isProduction && typeof window !== 'undefined' && window.fbq;
};

export const trackLimoFormSubmissionMeta = ({ tripType }) => {
  if (!canTrack()) return;

  window.fbq('track', 'Lead', {
    content_category: 'Chauffeur Service',
    trip_type: tripType,
  });
};

export const trackVehicleSelectionMeta = ({ id, brand, model }) => {
  if (!canTrack()) return;

  window.fbq('track', 'ViewContent', {
    content_ids: [id],
    content_name: `${brand} ${model}`,
    content_type: 'vehicle',
  });
};

export const trackBeginCheckoutMeta = ({ currency, value }) => {
  if (!canTrack()) return;

  window.fbq('track', 'InitiateCheckout', {
    currency,
    value,
  });
};

export const trackPurchaseEventMeta = ({ currency, value, transactionId }) => {
  if (!canTrack()) return;

  window.fbq('track', 'Purchase', {
    currency,
    value,
    transaction_id: transactionId,
  });
};

export function trackEvent(event, data = {}) {
  if (!window.fbq) return;
  window.fbq('track', event, data);
}
