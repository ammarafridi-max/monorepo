'use client';

import { useContext } from 'react';
import {
  Car,
  Bus,
  Check,
  Wifi,
  Users,
  Briefcase,
} from 'lucide-react';
import { TransferBookingContext } from '@travel-suite/frontend-shared/contexts/TransferBookingContext';

// TODO: Replace PLACEHOLDER_VEHICLES with the live supplier API response.
// Shape mirrors a real transfer supplier API — swap the array contents only;
// rendering logic stays unchanged.
const PLACEHOLDER_VEHICLES = [
  {
    id: 'economy-sedan',
    class: 'Economy',
    name: 'Standard Sedan',
    description:
      'Comfortable and affordable. Great for solo travelers or small groups on a budget.',
    maxPassengers: 3,
    maxLuggage: 2,
    image: null,
    features: ['Meet & greet', 'Free 60 min waiting', 'Free cancellation'],
    price: { amount: 35, currency: 'USD' },
    tag: 'Best value',
  },
  {
    id: 'comfort-sedan',
    class: 'Comfort',
    name: 'Comfort Sedan',
    description:
      'Newer, roomier vehicles with a smoother ride. Ideal for travelers who want more than the basics.',
    maxPassengers: 3,
    maxLuggage: 3,
    image: null,
    features: ['Meet & greet', 'Free 60 min waiting', 'Free cancellation', 'Wi-Fi'],
    price: { amount: 52, currency: 'USD' },
    tag: null,
  },
  {
    id: 'business-sedan',
    class: 'Business',
    name: 'Business Class Sedan',
    description:
      'Premium sedans for business travelers. Professional, punctual, and polished.',
    maxPassengers: 3,
    maxLuggage: 3,
    image: null,
    features: [
      'Meet & greet',
      'Free 90 min waiting',
      'Free cancellation',
      'Wi-Fi',
      'Water & refreshments',
    ],
    price: { amount: 85, currency: 'USD' },
    tag: 'Recommended',
  },
  {
    id: 'van-mpv',
    class: 'Van / MPV',
    name: 'People Carrier',
    description:
      'Spacious 7-seater for families and groups. Plenty of room for everyone and their luggage.',
    maxPassengers: 7,
    maxLuggage: 6,
    image: null,
    features: [
      'Meet & greet',
      'Free 60 min waiting',
      'Free cancellation',
      'Child seat available',
    ],
    price: { amount: 75, currency: 'USD' },
    tag: null,
  },
  {
    id: 'luxury-suv',
    class: 'Luxury',
    name: 'Luxury SUV',
    description:
      'Arrive in style in a premium SUV. The finest vehicles, the finest experience.',
    maxPassengers: 4,
    maxLuggage: 4,
    image: null,
    features: [
      'Meet & greet',
      'Free 90 min waiting',
      'Free cancellation',
      'Wi-Fi',
      'Water & refreshments',
      'Leather interior',
    ],
    price: { amount: 150, currency: 'USD' },
    tag: null,
  },
];

function vehicleIconComponent(vehicleClass) {
  return vehicleClass === 'Van / MPV' ? Bus : Car;
}

function featureIcon(feature) {
  if (feature.toLowerCase().includes('wi-fi')) return Wifi;
  return Check;
}

function VehicleCard({ vehicle, isSelected, onSelect }) {
  const VehicleIcon = vehicleIconComponent(vehicle.class);
  const isRecommended = vehicle.tag === 'Recommended';

  return (
    <div
      className={[
        'relative overflow-hidden rounded-card bg-white transition-shadow',
        isSelected
          ? 'ring-2 ring-clay-600 shadow-warm'
          : isRecommended
          ? 'ring-1 ring-clay-300 shadow-warm-sm'
          : 'ring-1 ring-sand-300/70 shadow-warm-sm',
      ].join(' ')}
    >
      {vehicle.tag && (
        <span
          className={[
            'absolute right-4 top-4 z-10 rounded-pill px-3 py-1 text-xs font-semibold',
            isRecommended
              ? 'bg-clay-600 text-white'
              : 'bg-clay-50 text-clay-700 ring-1 ring-clay-200',
          ].join(' ')}
        >
          {vehicle.tag}
        </span>
      )}

      <div className="flex flex-col sm:flex-row">
        <div className="relative h-36 w-full shrink-0 sm:h-auto sm:w-44">
          {vehicle.image ? (
            <img
              src={vehicle.image}
              alt={vehicle.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-sand-100">
              <VehicleIcon size={34} className="text-sand-400" />
            </div>
          )}
          <span className="absolute bottom-3 left-3 rounded-pill bg-ink/75 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
            {vehicle.class}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <h3 className="text-base font-semibold text-ink">{vehicle.name}</h3>
          <p className="mt-1 text-sm font-light leading-relaxed text-ink-soft">
            {vehicle.description}
          </p>

          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {vehicle.features.map((feature) => {
              const Icon = featureIcon(feature);
              return (
                <li key={feature} className="flex items-center gap-1.5 text-xs text-ink-soft">
                  <Icon size={12} className="shrink-0 text-clay-500" />
                  {feature}
                </li>
              );
            })}
          </ul>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-sand-100 pt-4">
            <div className="flex gap-4 text-xs text-ink-mute">
              <span className="flex items-center gap-1">
                <Users size={12} />
                Max {vehicle.maxPassengers}
              </span>
              <span className="flex items-center gap-1">
                <Briefcase size={12} />
                Max {vehicle.maxLuggage} bags
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-lg font-bold text-ink">
                  {vehicle.price.currency} {vehicle.price.amount}
                </p>
                <p className="text-[11px] text-ink-mute">fixed price</p>
              </div>
              <button
                type="button"
                onClick={() => onSelect(vehicle)}
                className={[
                  'inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors',
                  isSelected
                    ? 'bg-clay-700 text-white'
                    : 'bg-clay-100 text-clay-700 hover:bg-clay-200',
                ].join(' ')}
              >
                {isSelected ? (
                  <>
                    <Check size={14} strokeWidth={3} />
                    Selected
                  </>
                ) : (
                  'Select'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-20 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sand-200">
        <Car size={28} className="text-ink-mute" />
      </div>
      <h2 className="text-xl font-semibold text-ink">No transfers available for this route</h2>
      <p className="mx-auto mt-2 max-w-md text-sm font-light leading-relaxed text-ink-soft">
        We don&apos;t cover this route yet, but we&apos;re expanding. Leave your email and
        we&apos;ll let you know when we do.
      </p>
    </div>
  );
}

export default function SelectVehiclePage() {
  const { selectedVehicle, setSelectedVehicle } = useContext(TransferBookingContext);
  const vehicles = PLACEHOLDER_VEHICLES;

  function handleSelect(vehicle) {
    setSelectedVehicle(vehicle);
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink">Choose your vehicle</h1>
        <p className="mt-1 text-sm font-light text-ink-soft">
          {vehicles.length} {vehicles.length === 1 ? 'option' : 'options'} available
        </p>
      </div>

      {vehicles.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-4">
          {vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              isSelected={selectedVehicle?.id === vehicle.id}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}
    </>
  );
}
