'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useContext, useTransition, Fragment } from 'react';
import { FaCircle } from 'react-icons/fa';
import { PlaneLandingIcon, PlaneTakeoff } from 'lucide-react';
import { trackFlightSearch } from '../../../utils/analytics';
import { TicketContext } from '../../../contexts/TicketContext.js';
import Label from '../form-elements/Label';
import PrimaryButton from '../PrimaryButton';
import SelectAirport from '../form-elements/SelectAirport';
import DatePicker from '../form-elements/DatePicker';
import Counter from '../form-elements/Counter';
import FieldError from '../ui/FieldError';
import { todayDateOnly } from '../../../utils/dates';

export default function TicketForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
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

  const isFormValid = () => {
    if (!from) {
      toast.error('From field is required');
      return false;
    }
    if (!to) {
      toast.error('To field is required');
      return false;
    }
    if (!departureDate) {
      toast.error('Departure date is required');
      return false;
    }
    if (type === 'Return' && !returnDate) {
      toast.error('Return date is required');
      return false;
    }
    if (quantity.adults < 1 || quantity.adults + quantity.children + quantity.infants > 9) {
      toast.error('Total passengers must be between 1 and 9');
      return false;
    }
    return true;
  };

  function handleFieldChange(field, value) {
    if (field === 'type') setType(value);
    if (field === 'from') setFrom(value);
    if (field === 'to') setTo(value);
    if (field === 'departureDate') setDepartureDate(value);
    if (field === 'returnDate') setReturnDate(value);
  }

  function handleQuantityChange(field, value) {
    const updatedQuantity = {
      ...quantity,
      [field]: quantity[field] + value,
    };

    const totalPassengers =
      updatedQuantity.adults + updatedQuantity.children + updatedQuantity.infants;

    if (totalPassengers > 9 || updatedQuantity.adults < 1) {
      toast.error('Total passengers cannot be less than 1 or exceed 9.');
      return;
    }

    setQuantity(updatedQuantity);
  }

  const handleFormSubmit = e => {
    e.preventDefault();
    if (isFormValid()) {
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
    }
  };

  return (
    <form
      className="m-0 py-7 px-4 md:p-6 rounded-2xl shadow-[0px_0px_10px_0px_rgba(0,0,0,0.1)] bg-white"
      onSubmit={handleFormSubmit}
    >
      <div className="flex gap-2.5">
        {['One Way', 'Return'].map(tripType => (
          <div
            className="text-[14.5px] w-fit flex items-center mb-5 cursor-pointer font-light"
            key={tripType}
            onClick={() => handleFieldChange('type', tripType)}
          >
            <FaCircle
              className={`mr-2 p-0.75 text-lg rounded-full border border-solid border-black ${
                type === tripType ? 'text-black' : 'text-transparent'
              }`}
            />
            {tripType}
          </div>
        ))}
      </div>

      <div className="block md:flex gap-3 md:gap-3.5">
        <div className="w-full md:w-[50%] flex flex-col gap-1 mb-3 md:mb-3">
          <Label htmlFor="from">From</Label>
          <SelectAirport
            value={from || ''}
            onChange={airport => handleFieldChange('from', airport)}
            icon={<PlaneTakeoff size={19} className="text-gray-500" />}
          />
        </div>
        <div className="w-full md:w-[50%] flex flex-col gap-1 mb-3 md:mb-3">
          <Label htmlFor="to">To</Label>
          <SelectAirport
            value={to || ''}
            onChange={airport => handleFieldChange('to', airport)}
            icon={<PlaneLandingIcon size={19} className="text-gray-500" />}
          />
        </div>
      </div>

      <div className="flex gap-3 md:gap-3.5">
        <div
          className={`w-full flex flex-col gap-1 mb-3 md:mb-3 ${
            type === 'Return' ? 'md:w-[50%]' : 'md:w-full'
          }`}
        >
          <Label htmlFor="departureDate">Departure Date</Label>
          <DatePicker
            value={departureDate}
            onChange={date => handleFieldChange('departureDate', date)}
            minDate={todayDateOnly()}
            placeholder="Select departure date"
          />
        </div>

        {type === 'Return' && (
          <div className="w-full md:w-[50%] flex flex-col gap-1 mb-3 md:mb-3">
            <Label htmlFor="returnDate">Return Date</Label>
            <DatePicker
              value={returnDate}
              onChange={date => handleFieldChange('returnDate', date)}
              minDate={departureDate || todayDateOnly()}
              placeholder="Select return date"
            />
          </div>
        )}
      </div>

      <QuantityCounter quantity={quantity} onQuantityChange={handleQuantityChange} />

      <div className="w-full flex mt-5">
        <PrimaryButton
          className="w-full"
          type="submit"
          disabled={isPending || !from || !to || !departureDate || (type === 'Return' && !returnDate)}
        >
          {isPending ? 'Searching...' : 'Search Flights'}
        </PrimaryButton>
      </div>
    </form>
  );
}

function QuantityCounter({ quantity, onQuantityChange, error }) {
  const categories = [
    { label: 'Adults', ageRange: '(12+)', field: 'adults' },
    { label: 'Children', ageRange: '(2 - 11)', field: 'children' },
    { label: 'Infants', ageRange: '(0 - 1)', field: 'infants' },
  ];

  return (
    <>
      <div className="border border-gray-200 rounded-xl px-4 py-3 flex flex-col gap-3 mt-3">
        {categories.map(({ label, ageRange, field }, i) => (
          <Fragment key={field}>
            {i > 0 && <div className="border-t border-gray-100" />}
            <Counter
              ageGroup={label}
              age={ageRange}
              onAdd={() => onQuantityChange(field, 1)}
              onSubtract={() => onQuantityChange(field, -1)}
              value={quantity[field]}
            />
          </Fragment>
        ))}
      </div>
      {error && <FieldError>{error}</FieldError>}
    </>
  );
}
