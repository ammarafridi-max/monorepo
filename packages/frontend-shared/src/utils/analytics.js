import ReactGA from 'react-ga4';
const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;

const isProduction = process.env.NODE_ENV === 'production';
const COMMISSION_RATE = Number(process.env.NEXT_PUBLIC_COMMISSION_RATE);

const isAdminPath = () =>
  typeof window !== 'undefined' &&
  window.location.pathname.startsWith('/admin');

const shouldTrackAnalytics = () => isProduction && !isAdminPath();

function gaEvent(name, params) {
  if (!shouldTrackAnalytics()) return false;
  ReactGA.event(name, params);
  return true;
}

function onceFlag(namespace) {
  const storageKey = (key) => `${namespace}${key}`;
  return {
    seen(key) {
      if (typeof window === 'undefined' || !key) return false;
      try {
        return window.localStorage.getItem(storageKey(key)) === '1';
      } catch {
        return false;
      }
    },
    mark(key) {
      if (typeof window === 'undefined' || !key) return;
      try {
        window.localStorage.setItem(storageKey(key), '1');
      } catch {}
    },
  };
}

const purchaseOnce = onceFlag('ga4:purchase:');
const commissionOnce = onceFlag('ga4:commission:');

export function trackCommissionEvent({
  currency,
  value,
  transactionId,
  dedupeKey = transactionId,
  rate = COMMISSION_RATE,
}) {
  if (!shouldTrackAnalytics() || !dedupeKey) return;
  if (!Number.isFinite(rate) || rate <= 0 || rate > 1) return;
  const gross = Number(value);
  if (!Number.isFinite(gross) || gross <= 0) return;
  if (commissionOnce.seen(dedupeKey)) return;

  gaEvent('commission', {
    transaction_id: transactionId,
    value: parseFloat((gross * rate).toFixed(2)),
    currency,
  });

  commissionOnce.mark(dedupeKey);
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
  gaEvent('flight_search', {
    type,
    from,
    to,
    departureDate,
    returnDate: returnDate || null,
    passengers: quantity.adults + quantity.children,
  });
}

export function trackSelectFlight({ tripType, carrierCode, flightNumber, ticketValidity, price, index = 0 }) {
  gaEvent('select_item', {
    item_list_id: 'flight_results',
    item_list_name: 'Flight Results',
    items: [
      {
        item_id: [carrierCode, flightNumber].filter(Boolean).join('') || 'flight',
        item_name: `${tripType} flight reservation`,
        item_category: ticketValidity,
        price,
        quantity: 1,
        index,
      },
    ],
  });
}

export function trackAddToCart({ tripType, ticketValidity, price, passengers, currency }) {
  gaEvent('add_to_cart', {
    currency,
    value: parseFloat(((price || 0) * (passengers || 1)).toFixed(2)),
    items: [
      {
        item_name: `${tripType} flight reservation`,
        item_category: ticketValidity,
        price,
        quantity: passengers || 1,
      },
    ],
  });
}

export function trackVisaLeadOpen({ visaSlug, packageRequested, source }) {
  gaEvent('lead_form_open', {
    visa_slug: visaSlug || 'unknown',
    package: packageRequested || 'undecided',
    lead_source: source || 'unknown',
  });
}

export function trackVisaLeadSubmit({ visaSlug, packageRequested, applicantCount, source }) {
  gaEvent('generate_lead', {
    visa_slug: visaSlug || 'unknown',
    package: packageRequested || 'undecided',
    applicant_count: applicantCount || 1,
    lead_source: source || 'unknown',
  });
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
  gaEvent('quote_started', {
    journey_type: journeyType,
    start_date: startDate,
    end_date: endDate,
    region,
    adults,
    children,
    seniors,
  });
}

export function trackViewItemList({
  plans,
  journeyType,
  region,
  days,
  totalTravellers,
}) {
  if (!shouldTrackAnalytics()) return;

  gaEvent('view_item_list', {
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

  gaEvent('select_item', {
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
  currency,
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

  gaEvent('begin_checkout', {
    currency,
    value: parseFloat(value ?? total ?? 0),
    items: finalItems,
  });
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
    purchaseOnce.seen(dedupeKey || transactionId)
  )
    return;

  gaEvent('purchase', {
    transaction_id: transactionId,
    value,
    currency,
    items,
  });

  purchaseOnce.mark(dedupeKey || transactionId);
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
  if (purchaseOnce.seen(dedupeKey)) return;

  const currency = amountPaid?.currency;
  const value = parseFloat(amountPaid?.amount ?? 0);

  gaEvent('purchase', {
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

  purchaseOnce.mark(dedupeKey);
}

function itineraryItem({ value, currency } = {}) {
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
  gaEvent('itinerary_generate', {
    purpose,
    visa_country: visaCountry,
    from_country: fromCountry,
    travellers,
    segment_count: segmentCount,
  });
}

export function trackItineraryViewItem({ value, currency } = {}) {
  gaEvent('view_item', {
    currency,
    value: parseFloat(value),
    items: [itineraryItem({ value, currency })],
  });
}

export function trackItineraryBeginCheckout({ value, currency } = {}) {
  gaEvent('begin_checkout', {
    currency,
    value: parseFloat(value),
    items: [itineraryItem({ value, currency })],
  });
}

export function trackItineraryPurchase({ sessionId, value, currency } = {}) {
  if (!sessionId || purchaseOnce.seen(sessionId)) return;
  if (
    !gaEvent('purchase', {
      transaction_id: sessionId,
      value: parseFloat(value),
      currency,
      items: [itineraryItem({ value, currency })],
    })
  )
    return;
  purchaseOnce.mark(sessionId);
}
