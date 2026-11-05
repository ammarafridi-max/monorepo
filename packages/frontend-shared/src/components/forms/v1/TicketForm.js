'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useContext, useState, useRef, useTransition, Fragment } from 'react';
import { FaCircle } from 'react-icons/fa';
import { PlaneLandingIcon, PlaneTakeoff } from 'lucide-react';
import { trackFlightSearch } from '../../../utils/analytics';
import { TicketContext } from '../../../contexts/TicketContext.js';
import Label from '../../form-elements/v1/Label';
import PrimaryButton from '../../ui/v1/PrimaryButton';
import SelectAirport from '../../form-elements/v1/SelectAirport';
import DatePicker from '../../form-elements/v1/DatePicker';
import Counter from '../../form-elements/v1/Counter';
import FieldError from '../../ui/v1/FieldError';
import { todayDateOnlyDubai, compareDateOnly } from '../../../utils/dates';

const MAX_PASSENGERS = 9;

export default function TicketForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState({});
  const fromRef = useRef(null);
  const toRef = useRef(null);
  const departureRef = useRef(null);
  const returnRef = useRef(null);

  const {
    type,
    from,
    to,
    departureDate,
    returnDate,
    quantity,
    setType,
    setFrom,
    setTo,
    setDepartureDate,
    setReturnDate,
    setQuantity,
  } = useContext(TicketContext);

  const totalPassengers = quantity.adults + quantity.children + quantity.infants;

  function buildErrors() {
    const next = {};
    if (!from) next.from = 'Select a departure airport';
    if (!to) next.to = 'Select a destination airport';
    if (!departureDate) next.departureDate = 'Select a departure date';
    if (type === 'Return' && !returnDate) next.returnDate = 'Select a return date';
    if (
      type === 'Return' &&
      departureDate &&
      returnDate &&
      compareDateOnly(returnDate, departureDate) < 0
    ) {
      next.returnDate = 'Your return date cannot be before your departure date';
    }
    return next;
  }

  function focusFirstError(next) {
    const order = [
      ['from', fromRef],
      ['to', toRef],
      ['departureDate', departureRef],
      ['returnDate', returnRef],
    ];
    for (const [key, ref] of order) {
      if (next[key] && ref.current) {
        ref.current.focus();
        ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }
  }

  function clearError(field) {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const { [field]: _removed, ...rest } = prev;
      void _removed;
      return rest;
    });
  }

  function handleFieldChange(field, value) {
    if (field === 'type') setType(value);
    if (field === 'from') setFrom(value);
    if (field === 'to') setTo(value);
    if (field === 'returnDate') setReturnDate(value);
    if (field === 'departureDate') {
      setDepartureDate(value);
      if (value && returnDate && compareDateOnly(returnDate, value) < 0) {
        setReturnDate('');
        clearError('returnDate');
      }
    }
    if (value && errors[field]) clearError(field);
  }

  function handleQuantityChange(field, value) {
    const updatedQuantity = {
      ...quantity,
      [field]: quantity[field] + value,
    };

    const nextTotal =
      updatedQuantity.adults + updatedQuantity.children + updatedQuantity.infants;

    if (nextTotal > MAX_PASSENGERS) {
      toast.error(`You can book up to ${MAX_PASSENGERS} passengers per reservation.`);
      return;
    }
    if (updatedQuantity.infants > updatedQuantity.adults) {
      toast.error('Each infant needs an adult travelling with them.');
      return;
    }

    setQuantity(updatedQuantity);
  }

  const handleFormSubmit = e => {
    e.preventDefault();
    const next = buildErrors();
    if (Object.keys(next).length > 0) {
      setErrors(next);
      focusFirstError(next);
      return;
    }
    setErrors({});
    trackFlightSearch({
      type,
      from,
      to,
      departureDate,
      returnDate,
      quantity,
    });
    startTransition(() => {
      router.push('/booking/select-flights');
    });
  };

  return (
    <form
      className="m-0 py-7 px-4 md:p-6 rounded-2xl shadow-[0px_0px_10px_0px_rgba(0,0,0,0.1)] bg-white"
      onSubmit={handleFormSubmit}
      noValidate
    >
      <div className="flex gap-2.5" role="radiogroup" aria-label="Trip type">
        {['One Way', 'Return'].map(tripType => (
          <label
            className="text-[14.5px] w-fit flex items-center mb-5 cursor-pointer font-light"
            key={tripType}
          >
            <input
              type="radio"
              name="tripType"
              value={tripType}
              checked={type === tripType}
              onChange={() => handleFieldChange('type', tripType)}
              className="sr-only peer"
            />
            <FaCircle
              aria-hidden="true"
              className={`mr-2 p-0.75 text-lg rounded-full border border-solid border-black peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 ${
                type === tripType ? 'text-black' : 'text-transparent'
              }`}
            />
            {tripType}
          </label>
        ))}
      </div>

      <div className="block md:flex gap-3 md:gap-3.5">
        <div className="w-full md:w-[50%] flex flex-col gap-1 mb-3 md:mb-3">
          <Label htmlFor="ticket-from">From</Label>
          <SelectAirport
            id="ticket-from"
            value={from || ''}
            onChange={airport => handleFieldChange('from', airport)}
            icon={<PlaneTakeoff size={19} className="text-gray-500" />}
            error={errors.from}
            inputRef={fromRef}
          />
          {errors.from && <FieldError>{errors.from}</FieldError>}
        </div>
        <div className="w-full md:w-[50%] flex flex-col gap-1 mb-3 md:mb-3">
          <Label htmlFor="ticket-to">To</Label>
          <SelectAirport
            id="ticket-to"
            value={to || ''}
            onChange={airport => handleFieldChange('to', airport)}
            icon={<PlaneLandingIcon size={19} className="text-gray-500" />}
            error={errors.to}
            inputRef={toRef}
          />
          {errors.to && <FieldError>{errors.to}</FieldError>}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:gap-3.5">
        <div
          className={`w-full flex flex-col gap-1 mb-3 md:mb-3 ${
            type === 'Return' ? 'md:w-[50%]' : 'md:w-full'
          }`}
        >
          <Label htmlFor="departureDate">Departure Date</Label>
          <DatePicker
            value={departureDate}
            onChange={date => handleFieldChange('departureDate', date)}
            minDate={todayDateOnlyDubai()}
            placeholder="Select departure date"
            error={errors.departureDate}
            inputRef={departureRef}
          />
          {errors.departureDate && <FieldError>{errors.departureDate}</FieldError>}
        </div>

        {type === 'Return' && (
          <div className="w-full md:w-[50%] flex flex-col gap-1 mb-3 md:mb-3">
            <Label htmlFor="returnDate">Return Date</Label>
            <DatePicker
              value={returnDate}
              onChange={date => handleFieldChange('returnDate', date)}
              minDate={departureDate || todayDateOnlyDubai()}
              placeholder="Select return date"
              error={errors.returnDate}
              inputRef={returnRef}
            />
            {errors.returnDate && <FieldError>{errors.returnDate}</FieldError>}
          </div>
        )}
      </div>

      <QuantityCounter
        quantity={quantity}
        onQuantityChange={handleQuantityChange}
        remaining={MAX_PASSENGERS - totalPassengers}
      />

      <div className="w-full flex mt-5">
        <PrimaryButton
          className="w-full"
          type="submit"
          disabled={isPending}
        >
          {isPending ? 'Searching...' : 'Search Flights'}
        </PrimaryButton>
      </div>

      <p className="mt-3 text-center text-[12px] leading-5 text-gray-500">
        We reserve flights, we do not buy them. A reservation supports your visa file; it does not
        guarantee approval.
      </p>
    </form>
  );
}

function QuantityCounter({ quantity, onQuantityChange, remaining, error }) {
  const categories = [
    { label: 'Adults', ageRange: '(12+)', field: 'adults', min: 1 },
    { label: 'Children', ageRange: '(2 - 11)', field: 'children', min: 0 },
    { label: 'Infants', ageRange: '(0 - 1)', field: 'infants', min: 0 },
  ];

  return (
    <>
      <div className="border border-gray-200 rounded-xl px-4 py-3 flex flex-col gap-3 mt-3">
        {categories.map(({ label, ageRange, field, min }, i) => (
          <Fragment key={field}>
            {i > 0 && <div className="border-t border-gray-100" />}
            <Counter
              ageGroup={label}
              age={ageRange}
              min={min}
              onAdd={() => onQuantityChange(field, 1)}
              onSubtract={() => onQuantityChange(field, -1)}
              value={quantity[field]}
            />
          </Fragment>
        ))}
        <p className="text-xs text-gray-400">
          Up to {MAX_PASSENGERS} passengers per reservation. You have {remaining} left.
        </p>
      </div>
      {error && <FieldError>{error}</FieldError>}
    </>
  );
}
