'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useState, useRef, useTransition, Fragment } from 'react';
import { useHotelContext } from '../../../contexts/HotelContext.js';
import { suggestHotelCitiesApi } from '../../../services/apiHotelBookings.js';
import Label from '../../form-elements/v1/Label';
import CitySelect from '../../form-elements/v1/CitySelect';
import PrimaryButton from '../../ui/v1/PrimaryButton';
import DatePicker from '../../form-elements/v1/DatePicker';
import Counter from '../../form-elements/v1/Counter';
import FieldError from '../../ui/v1/FieldError';
import { todayDateOnly, compareDateOnly } from '../../../utils/dates';

function addDays(dateStr, days) {
  const date = new Date(`${dateStr}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

const MAX_ROOMS = 5;
const MAX_ADULTS = 8;

const FIELD_CLASS =
  'w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-400';

const FIELD_CLASS_ERROR =
  'w-full bg-white text-sm text-gray-900 px-4 py-2.5 rounded-xl border border-red-600 focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-400';

export default function HotelForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState({});
  const cityRef = useRef(null);
  const checkInRef = useRef(null);
  const checkOutRef = useRef(null);

  const {
    cityName,
    countryCode,
    checkIn,
    checkOut,
    occupancy,
    setCityName,
    setCountryCode,
    setCheckIn,
    setCheckOut,
    setOccupancy,
  } = useHotelContext();

  const selectedCity = cityName && countryCode
    ? { name: cityName, countryCode, label: `${cityName}, ${countryCode}` }
    : null;

  const nights =
    checkIn && checkOut && compareDateOnly(checkOut, checkIn) > 0
      ? Math.round(
          (new Date(`${checkOut}T00:00:00Z`) - new Date(`${checkIn}T00:00:00Z`)) / 86400000,
        )
      : 0;

  const handleCitySearch = (search, options) => suggestHotelCitiesApi(search, options);

  function handleCitySelect(city) {
    setCityName(city.name);
    setCountryCode(city.countryCode);
    clearError('cityName', city.name);
  }

  function buildErrors() {
    const next = {};
    if (!cityName?.trim() || !countryCode) next.cityName = 'Select the city you are staying in';
    if (!checkIn) next.checkIn = 'Select a check in date';
    if (!checkOut) next.checkOut = 'Select a check out date';
    if (checkIn && checkOut && compareDateOnly(checkOut, checkIn) <= 0) {
      next.checkOut = 'Check out must be at least one night after check in';
    }
    return next;
  }

  function focusFirstError(next) {
    const order = [
      ['cityName', cityRef],
      ['checkIn', checkInRef],
      ['checkOut', checkOutRef],
    ];
    for (const [key, ref] of order) {
      if (next[key] && ref.current) {
        ref.current.focus();
        ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }
  }

  function clearError(field, value) {
    if (value && errors[field]) {
      setErrors((prev) => {
        const { [field]: _removed, ...rest } = prev;
        void _removed;
        return rest;
      });
    }
  }

  function handleCheckIn(value) {
    setCheckIn(value);
    if (value && checkOut && compareDateOnly(checkOut, value) <= 0) {
      setCheckOut(addDays(value, 1));
      clearError('checkOut', addDays(value, 1));
    }
    clearError('checkIn', value);
  }

  function handleOccupancyChange(field, delta) {
    const next = { ...occupancy, [field]: (occupancy[field] ?? 0) + delta };
    if (next.rooms > MAX_ROOMS) {
      toast.error(`For more than ${MAX_ROOMS} rooms, please contact us directly.`);
      return;
    }
    if (next.adults > MAX_ADULTS) {
      toast.error(`For more than ${MAX_ADULTS} adults, please contact us directly.`);
      return;
    }
    setOccupancy(next);
  }

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const next = buildErrors();
    if (Object.keys(next).length > 0) {
      setErrors(next);
      focusFirstError(next);
      return;
    }
    setErrors({});
    startTransition(() => {
      router.push('/hotel-booking/select-hotel');
    });
  };

  return (
    <form
      className="m-0 py-7 px-4 md:p-6 rounded-2xl shadow-[0px_0px_10px_0px_rgba(0,0,0,0.1)] bg-white"
      onSubmit={handleFormSubmit}
      noValidate
    >
      <div className="w-full flex flex-col gap-1 mb-3 md:mb-3">
        <Label htmlFor="hotel-city">City</Label>
        <CitySelect
          inputId="hotel-city"
          inputRef={cityRef}
          value={selectedCity}
          onChange={handleCitySelect}
          onSearch={handleCitySearch}
          error={errors.cityName}
          inputClassName={`${errors.cityName ? FIELD_CLASS_ERROR : FIELD_CLASS} pl-11`}
        />
        {errors.cityName && <FieldError>{errors.cityName}</FieldError>}
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:gap-3.5">
        <div className="w-full md:w-[50%] flex flex-col gap-1 mb-3 md:mb-3">
          <Label htmlFor="checkIn">Check in Date</Label>
          <DatePicker
            value={checkIn}
            onChange={handleCheckIn}
            minDate={todayDateOnly()}
            placeholder="Select check in date"
            error={errors.checkIn}
            inputRef={checkInRef}
          />
          {errors.checkIn && <FieldError>{errors.checkIn}</FieldError>}
        </div>

        <div className="w-full md:w-[50%] flex flex-col gap-1 mb-3 md:mb-3">
          <Label htmlFor="checkOut">Check out Date</Label>
          <DatePicker
            value={checkOut}
            onChange={(date) => { setCheckOut(date); clearError('checkOut', date); }}
            minDate={checkIn ? addDays(checkIn, 1) : addDays(todayDateOnly(), 1)}
            placeholder="Select check out date"
            error={errors.checkOut}
            inputRef={checkOutRef}
          />
          {errors.checkOut && <FieldError>{errors.checkOut}</FieldError>}
          {!errors.checkOut && nights > 0 && (
            <p className="text-xs text-gray-400">
              {nights} {nights === 1 ? 'night' : 'nights'}
            </p>
          )}
        </div>
      </div>

      <OccupancyCounter occupancy={occupancy} onChange={handleOccupancyChange} />

      <div className="w-full flex mt-5">
        <PrimaryButton className="w-full" type="submit" disabled={isPending}>
          {isPending ? 'Searching...' : 'Search Hotels'}
        </PrimaryButton>
      </div>

      <p className="mt-3 text-center text-[12px] leading-5 text-gray-500">
        Our team books your hotel reservation by hand and emails it to you. A reservation supports
        your visa file; it does not guarantee approval.
      </p>
    </form>
  );
}

function OccupancyCounter({ occupancy, onChange }) {
  const categories = [
    { label: 'Rooms', ageRange: '', field: 'rooms', min: 1, max: MAX_ROOMS },
    { label: 'Adults', ageRange: '(18+)', field: 'adults', min: 1, max: MAX_ADULTS },
  ];

  return (
    <div className="border border-gray-200 rounded-xl px-4 py-3 flex flex-col gap-3 mt-3">
      {categories.map(({ label, ageRange, field, min, max }, i) => (
        <Fragment key={field}>
          {i > 0 && <div className="border-t border-gray-100" />}
          <Counter
            ageGroup={label}
            age={ageRange}
            min={min}
            max={max}
            onAdd={() => onChange(field, 1)}
            onSubtract={() => onChange(field, -1)}
            value={occupancy[field]}
          />
        </Fragment>
      ))}
    </div>
  );
}
