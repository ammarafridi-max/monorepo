'use client';

import { useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import DatePicker from './DatePicker';
import TimePicker from './TimePicker';
import LocationInput from './LocationInput';
import { TransferBookingContext } from '@travel-suite/frontend-shared/contexts/TransferBookingContext';

function Field({ label, className = '', children }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-mute">
        {label}
      </span>
      {children}
    </div>
  );
}

const selectCls =
  'w-full rounded-xl border border-sand-300 bg-white px-4 py-3 text-[15px] text-ink focus:border-clay-500 focus:outline-none focus:ring-2 focus:ring-clay-500/20 transition-colors';

function todayStr() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isDateInPast(dateStr) {
  if (!dateStr) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);
  return new Date(y, m - 1, d) < midnight;
}

function isDateTimeInPast(dateStr, timeStr) {
  if (!dateStr || !timeStr) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  const [h, min] = timeStr.split(':').map(Number);
  return new Date(y, m - 1, d, h, min) < new Date();
}

export default function BookingForm({ onSubmit, className = '' }) {
  const router = useRouter();
  const { setPickup, setDropoff, setDate, setTime, setPassengers, setLuggage } =
    useContext(TransferBookingContext);

  const [booking, setBooking] = useState({
    pickup:     null,
    dropoff:    null,
    date:       '',
    time:       '',
    passengers: '1',
    luggage:    '0',
  });

  function setLocation(field) {
    return (location) => setBooking((prev) => ({ ...prev, [field]: location }));
  }

  function set(field) {
    return (value) =>
      setBooking((prev) => ({
        ...prev,
        [field]: typeof value === 'string' ? value : value.target.value,
      }));
  }

  function handleDateChange(dateStr) {
    if (!dateStr || isDateInPast(dateStr)) return;
    // If switching to today, drop any time that's already passed
    const time = booking.time && isDateTimeInPast(dateStr, booking.time) ? '' : booking.time;
    setBooking((prev) => ({ ...prev, date: dateStr, time }));
  }

  function handleTimeChange(timeStr) {
    if (!timeStr || isDateTimeInPast(booking.date, timeStr)) return;
    setBooking((prev) => ({ ...prev, time: timeStr }));
  }

  const isValid = !!(booking.pickup && booking.dropoff && booking.date && booking.time);

  function handleSubmit(e) {
    e.preventDefault();
    if (!isValid) return;

    setPickup({ label: booking.pickup.name, id: booking.pickup.id, type: booking.pickup.type });
    setDropoff({ label: booking.dropoff.name, id: booking.dropoff.id, type: booking.dropoff.type });
    setDate(booking.date);
    setTime(booking.time);
    setPassengers(Number(booking.passengers));
    setLuggage(Number(booking.luggage));

    if (onSubmit) {
      onSubmit(booking);
      return;
    }

    router.push('/transfer-booking/select-vehicle');
  }

  return (
    <form
      id="book"
      onSubmit={handleSubmit}
      className={`scroll-mt-20 rounded-2xl bg-white p-6 shadow-warm ring-1 ring-sand-200 sm:p-8 ${className}`}
    >
      <div className="grid gap-4 sm:grid-cols-2">

        <Field label="Pick up" className="sm:col-span-2">
          <LocationInput
            value={booking.pickup}
            onChange={setLocation('pickup')}
            placeholder="Airport, hotel or address"
          />
        </Field>

        <Field label="Drop off" className="sm:col-span-2">
          <LocationInput
            value={booking.dropoff}
            onChange={setLocation('dropoff')}
            placeholder="Hotel, address or area"
          />
        </Field>

        <Field label="Pick up date">
          <DatePicker
            value={booking.date}
            onChange={handleDateChange}
            placeholder="Select date"
            minDate={todayStr()}
          />
        </Field>

        <Field label="Pick up time">
          <TimePicker
            value={booking.time}
            onChange={handleTimeChange}
            placeholder="Select time"
          />
        </Field>

        <Field label="Passengers">
          <select
            value={booking.passengers}
            onChange={set('passengers')}
            className={selectCls}
          >
            {['1', '2', '3', '4', '5', '6', '7+'].map((n) => (
              <option key={n} value={n}>
                {n} {n === '1' ? 'passenger' : 'passengers'}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Luggage">
          <select
            value={booking.luggage}
            onChange={set('luggage')}
            className={selectCls}
          >
            {[
              { value: '0',  label: 'No checked bags' },
              { value: '1',  label: '1 bag'           },
              { value: '2',  label: '2 bags'          },
              { value: '3',  label: '3 bags'          },
              { value: '4',  label: '4 bags'          },
              { value: '5+', label: '5+ bags'         },
            ].map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>

      </div>

      <button
        type="submit"
        disabled={!isValid}
        className={[
          'group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold transition-all duration-200 focus:outline-none',
          isValid
            ? 'bg-clay-600 text-white shadow-warm-sm hover:bg-clay-700 hover:shadow-warm focus:ring-4 focus:ring-clay-500/30'
            : 'cursor-not-allowed bg-sand-200 text-ink-mute shadow-none',
        ].join(' ')}
      >
        Get quotes
        {isValid && (
          <ArrowRight
            size={18}
            className="transition-transform duration-200 group-hover:translate-x-1"
          />
        )}
      </button>

      <p className="mt-3 text-center text-xs text-ink-mute">
        Free to check. No card needed.
      </p>
    </form>
  );
}
