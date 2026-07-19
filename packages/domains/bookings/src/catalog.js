// Authoritative airport-transfer vehicle catalogue — the SERVER-SIDE source of
// truth for pricing. Prices must NEVER be taken from the request body: a client
// can set any amount otherwise. The checkout/creation flow resolves the price
// here by the vehicle `id`.
//
// Keep this in sync with the frontend PLACEHOLDER_VEHICLES list in
// airportrides-frontend/src/app/transfer-booking/select-vehicle/page.js until the
// live supplier API replaces both (see the TODO there).
export const VEHICLE_CATALOG = {
  'economy-sedan':  { name: 'Standard Sedan',       class: 'Economy',   price: { amount: 35,  currency: 'USD' } },
  'comfort-sedan':  { name: 'Comfort Sedan',        class: 'Comfort',   price: { amount: 52,  currency: 'USD' } },
  'business-sedan': { name: 'Business Class Sedan', class: 'Business',  price: { amount: 85,  currency: 'USD' } },
  'van-mpv':        { name: 'People Carrier',       class: 'Van / MPV', price: { amount: 75,  currency: 'USD' } },
  'luxury-suv':     { name: 'Luxury SUV',           class: 'Luxury',    price: { amount: 150, currency: 'USD' } },
};

/**
 * Resolve a client-supplied vehicle selection to its authoritative, server-priced
 * record. Returns null for an unknown id so callers can reject (fail closed)
 * rather than trust client pricing.
 */
export function resolveVehicle(clientVehicle) {
  const id = clientVehicle?.id;
  const entry = id ? VEHICLE_CATALOG[id] : null;
  if (!entry) return null;
  return { id, name: entry.name, class: entry.class, price: { ...entry.price } };
}
