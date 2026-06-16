import ReactGA from 'react-ga4';
const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;

const isProduction = process.env.NODE_ENV === 'production';

const isAdminPath = () =>
  typeof window !== 'undefined' &&
  window.location.pathname.startsWith('/admin');

const shouldTrackAnalytics = () => isProduction && !isAdminPath();

const buildPurchaseStorageKey = (transactionId, dedupeKey = transactionId) =>
  `ga4:purchase:${dedupeKey || transactionId}`;

function hasTrackedPurchase(transactionId, dedupeKey) {
  if (typeof window === 'undefined' || !transactionId) return false;
  try {
    return (
      window.localStorage.getItem(
        buildPurchaseStorageKey(transactionId, dedupeKey),
      ) === '1'
    );
  } catch {
    return false;
  }
}

function markPurchaseTracked(transactionId, dedupeKey) {
  if (typeof window === 'undefined' || !transactionId) return;
  try {
    window.localStorage.setItem(
      buildPurchaseStorageKey(transactionId, dedupeKey),
      '1',
    );
  } catch {}
}

function buildItem(
  plan,
  { journeyType, regionName, days, totalTravellers = 1, index = 0 },
) {
  const id = plan.scheme_id ?? plan.id;
  const price = plan.pricePerDay
    ? parseFloat((plan.pricePerDay * days).toFixed(2))
    : parseFloat(plan.premium ?? 0);
  return {
    item_id: id,
    item_name: plan.name,
    item_category: journeyType,
    item_category2: regionName ?? undefined,
    price,
    quantity: totalTravellers,
    index,
  };
}

export function initializeGA() {
  if (shouldTrackAnalytics()) {
    ReactGA.initialize(GA4_MEASUREMENT_ID);
  }
}

export function trackFlightSearch({
  type,
  from,
  to,
  departureDate,
  returnDate,
  quantity,
}) {
  if (shouldTrackAnalytics()) {
    ReactGA.event('flight_search', {
      type,
      from,
      to,
      departureDate,
      returnDate: returnDate || null,
      passengers: quantity.adults + quantity.children,
    });
  }
}

export function trackFlightFormSubmission({
  passengers,
  email,
  phoneNumber,
  ticketValidity,
  flightDetails,
}) {
  if (shouldTrackAnalytics()) {
    ReactGA.event('flight_form_submission', {
      passengers,
      email,
      phoneNumber,
      ticketValidity,
      flightDetails,
    });
  }
}

export function trackQuoteStarted({
  journeyType,
  startDate,
  endDate,
  region,
  adults,
  children,
  seniors,
}) {
  if (shouldTrackAnalytics()) {
    ReactGA.event('quote_started', {
      journey_type: journeyType,
      start_date: startDate,
      end_date: endDate,
      region,
      adults,
      children,
      seniors,
    });
  }
}

export function trackViewItemList({
  plans,
  journeyType,
  region,
  days,
  totalTravellers,
}) {
  if (!shouldTrackAnalytics()) return;

  ReactGA.event('view_item_list', {
    item_list_id: 'quote_results',
    item_list_name: 'Quote Results',
    items: plans.map((plan, index) =>
      buildItem(plan, {
        journeyType,
        regionName: region?.name,
        days,
        totalTravellers,
        index,
      }),
    ),
  });
}

export function trackSelectItem({
  plan,
  journeyType,
  region,
  days,
  totalTravellers,
  index = 0,
}) {
  if (!shouldTrackAnalytics()) return;

  ReactGA.event('select_item', {
    item_list_id: 'quote_results',
    item_list_name: 'Quote Results',
    items: [
      buildItem(plan, {
        journeyType,
        regionName: region?.name,
        days,
        totalTravellers,
        index,
      }),
    ],
  });
}

export function trackBeginCheckout({
  plan,
  total,
  value,
  currency = 'AED',
  journeyType,
  region,
  days,
  totalTravellers,
  items,
}) {
  if (!shouldTrackAnalytics()) return;

  const finalItems = items ?? (plan
    ? [buildItem(plan, { journeyType, regionName: region?.name, days, totalTravellers })]
    : []);

  ReactGA.event('begin_checkout', {
    currency,
    value: parseFloat(value ?? total ?? 0),
    items: finalItems,
  });
}

export function trackQuoteCompleted({
  journeyType,
  region,
  days,
  totalTravellers,
  resultsCount,
}) {
  if (!shouldTrackAnalytics()) return;

  ReactGA.event('quote_completed', {
    journey_type: journeyType,
    region: region?.name,
    days,
    total_travellers: totalTravellers,
    results_count: resultsCount,
  });
}

export function trackPassengersCompleted({
  adults,
  children,
  seniors,
  totalTravellers,
}) {
  if (!shouldTrackAnalytics()) return;

  ReactGA.event('passengers_completed', {
    adults,
    children,
    seniors,
    total_travellers: totalTravellers,
  });
}

export function trackTripTypeSelected({ tripType }) {
  if (!shouldTrackAnalytics()) return;
  ReactGA.event('trip_type_selected', { trip_type: tripType });
}

export function trackDestinationSelected({ region }) {
  if (!shouldTrackAnalytics()) return;
  ReactGA.event('destination_selected', { region: region?.name ?? region });
}

export function trackLogin({ provider }) {
  if (!shouldTrackAnalytics()) return;
  ReactGA.event('login', { method: provider });
}

export function trackSignUp({ provider }) {
  if (!shouldTrackAnalytics()) return;
  ReactGA.event('sign_up', { method: provider });
}

export function trackPurchaseEvent({
  currency,
  value,
  sessionId,
  transactionId = sessionId,
  dedupeKey = transactionId,
  items = [{ item_name: 'Travel Insurance Policy', price: value, quantity: 1 }],
}) {
  if (
    !shouldTrackAnalytics() ||
    !transactionId ||
    hasTrackedPurchase(transactionId, dedupeKey)
  )
    return;

  ReactGA.event('purchase', {
    transaction_id: transactionId,
    value,
    currency,
    items,
  });

  markPurchaseTracked(transactionId, dedupeKey);
}

export function trackPurchase({
  transactionId,
  policyNumber,
  plan,
  amountPaid,
  journeyType,
  region,
  days,
  totalTravellers,
}) {
  if (!shouldTrackAnalytics()) return;
  if (!transactionId) return;

  const dedupeKey = policyNumber || transactionId;
  if (hasTrackedPurchase(transactionId, dedupeKey)) return;

  const currency = amountPaid?.currency ?? 'AED';
  const value = parseFloat(amountPaid?.amount ?? 0);

  ReactGA.event('purchase', {
    transaction_id: transactionId,
    value,
    currency,
    items: [
      buildItem(plan, {
        journeyType,
        regionName: region?.name,
        days,
        totalTravellers,
      }),
    ],
  });

  markPurchaseTracked(transactionId, dedupeKey);
}

// -- Travel itinerary funnel -------------------------------------------------

function itineraryItem({ value = 49, currency = 'AED' } = {}) {
  return {
    item_id: 'travel_itinerary',
    item_name: 'Travel Itinerary',
    item_category: 'Visa Document',
    price: parseFloat(value),
    quantity: 1,
    currency,
  };
}

export function trackItineraryGenerate({ purpose, visaCountry, fromCountry, travellers, segmentCount } = {}) {
  if (!shouldTrackAnalytics()) return;
  ReactGA.event('itinerary_generate', {
    purpose,
    visa_country: visaCountry,
    from_country: fromCountry,
    travellers,
    segment_count: segmentCount,
  });
}

export function trackItineraryViewItem({ value = 49, currency = 'AED' } = {}) {
  if (!shouldTrackAnalytics()) return;
  ReactGA.event('view_item', {
    currency,
    value: parseFloat(value),
    items: [itineraryItem({ value, currency })],
  });
}

export function trackItineraryBeginCheckout({ value = 49, currency = 'AED' } = {}) {
  if (!shouldTrackAnalytics()) return;
  ReactGA.event('begin_checkout', {
    currency,
    value: parseFloat(value),
    items: [itineraryItem({ value, currency })],
  });
}

// Fires once per session (deduped via localStorage) — the success page polls.
export function trackItineraryPurchase({ sessionId, value = 49, currency = 'AED' } = {}) {
  if (!shouldTrackAnalytics() || !sessionId || hasTrackedPurchase(sessionId)) return;
  ReactGA.event('purchase', {
    transaction_id: sessionId,
    value: parseFloat(value),
    currency,
    items: [itineraryItem({ value, currency })],
  });
  markPurchaseTracked(sessionId);
}
