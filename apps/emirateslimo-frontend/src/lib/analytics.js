import ReactGA from 'react-ga4';

const isProduction = process.env.NODE_ENV === 'production';

export const trackLimoFormSubmission = ({ tripType, pickup, dropoff, pickupDate, pickupTime, hoursBooked }) => {
  if (!isProduction) return;
  ReactGA.event('limo_form_submission', {
    tripType,
    pickup,
    dropoff,
    pickupDate,
    pickupTime,
    hoursBooked,
  });
};

export const trackVehicleSelection = ({ id, brand, model }) => {
  if (!isProduction) return;
  ReactGA.event('vehicle_selected', {
    vehicleId: id,
    brand,
    model,
  });
};

// No passenger identity here: GA4 forbids PII in event parameters.
export const trackBookingDetailsEntered = ({ tripType, isAirportTransfer, hasNotes }) => {
  if (!isProduction) return;
  ReactGA.event('booking_details_entered', {
    tripType,
    isAirportTransfer,
    hasNotes,
  });
};

export const trackBeginCheckout = ({ currency, value, items }) => {
  if (!isProduction) return;
  ReactGA.event('begin_checkout', {
    currency,
    value,
    items,
  });
};

const purchaseKey = (transactionId) => `ga4:purchase:${transactionId}`;

// The success page re-renders on refresh; a purchase is counted once per Stripe session.
export const trackPurchaseEvent = ({ currency, value, transactionId, items }) => {
  if (!isProduction || !transactionId) return;
  try {
    if (localStorage.getItem(purchaseKey(transactionId)) === '1') return;
    localStorage.setItem(purchaseKey(transactionId), '1');
  } catch {}
  ReactGA.event('purchase', {
    currency,
    value,
    transaction_id: transactionId,
    items,
  });
};
