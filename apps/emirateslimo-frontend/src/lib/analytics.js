import ReactGA from 'react-ga4';

const isProduction = process.env.NODE_ENV === 'production';

export const trackLimoFormSubmission = ({ tripType, pickup, dropoff, pickupDate, pickupTime, hoursBooked }) => {
  if (!isProduction) return;
  ReactGA.event('limo_form_submission', {
    tripType,
    pickup,
    dropoff: dropoff || null,
    pickupDate,
    pickupTime: pickupTime || null,
    hoursBooked: hoursBooked || null,
  });
};

export const trackVehicleSelection = ({ id, brand, model }) => {
  if (!isProduction) return;
  ReactGA.event('vehicle_selected', {
    id,
    brand,
    model,
  });
};

export const trackBookingDetailsEntered = ({
  firstName,
  lastName,
  email,
  phoneNumber,
  flightNumber,
  arrivalTime,
  message,
}) => {
  if (!isProduction) return;
  ReactGA.event('booking_details_entered', {
    firstName,
    lastName,
    email,
    phoneNumber,
    flightNumber,
    arrivalTime,
    message,
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

export const trackPurchaseEvent = ({
  currency,
  value,
  transactionId,
  items = [{ item_name: 'Chauffeur Service', price: 150, quantity: 1 }],
}) => {
  if (!isProduction) return;
  ReactGA.event('purchase', {
    transaction_id: transactionId,
    value,
    currency,
    items,
  });
};
