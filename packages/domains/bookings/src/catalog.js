// Server-side source of truth for transfer pricing: never take a price from the request body. Mirrors the frontend PLACEHOLDER_VEHICLES list.
export const VEHICLE_CATALOG = {
  'economy-sedan':  { name: 'Standard Sedan',       class: 'Economy',   price: { amount: 35,  currency: 'USD' } },
  'comfort-sedan':  { name: 'Comfort Sedan',        class: 'Comfort',   price: { amount: 52,  currency: 'USD' } },
  'business-sedan': { name: 'Business Class Sedan', class: 'Business',  price: { amount: 85,  currency: 'USD' } },
  'van-mpv':        { name: 'People Carrier',       class: 'Van / MPV', price: { amount: 75,  currency: 'USD' } },
  'luxury-suv':     { name: 'Luxury SUV',           class: 'Luxury',    price: { amount: 150, currency: 'USD' } },
};

export function resolveVehicle(clientVehicle) {
  const id = clientVehicle?.id;
  const entry = id ? VEHICLE_CATALOG[id] : null;
  if (!entry) return null;
  return { id, name: entry.name, class: entry.class, price: { ...entry.price } };
}
