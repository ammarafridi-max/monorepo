import ReactGA from 'react-ga4';
const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;

const isProduction = process.env.NODE_ENV === 'production';
// const isProduction = true;

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

// Handles both TFI's { id, pricePerDay } and Travl's { scheme_id, premium } quote shapes
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

/* --- Core --------------------------------------------------------------------- */

export function initializeGA() {
  if (shouldTrackAnalytics()) {
    ReactGA.initialize(GA4_MEASUREMENT_ID);
  }
}

/* --- Flight tracking ---------------------------------------------------------- */

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

/* --- Insurance funnel --------------------------------------------------------- */

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
  currency = 'AED',
  journeyType,
  region,
  days,
  totalTravellers,
}) {
  if (!shouldTrackAnalytics()) return;

  ReactGA.event('begin_checkout', {
    currency,
    value: parseFloat(total),
    items: [
      buildItem(plan, {
        journeyType,
        regionName: region?.name,
        days,
        totalTravellers,
      }),
    ],
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

/* --- Purchase (generic, with dedup) ------------------------------------------ */

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

/* --- Purchase (insurance-specific, with plan data) --------------------------- */

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
