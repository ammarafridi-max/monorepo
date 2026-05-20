'use client';

import React, { useContext, useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { InsuranceContext } from '../../../contexts/InsuranceContext.js';
import { useLocalStorage } from '../../../hooks/general/useLocalStorage.js';
import { pixelLead } from '../../../utils/pixel';
import { trackQuoteStarted } from '../../../utils/analytics';
import DatePicker from '../../form-elements/v2/DatePicker.js';
import { todayDateOnly } from '../../../utils/dates';

function Counter({ label, ageRange, value, onDecrement, onIncrement }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-gray-700">
        {label} <span className="text-xs text-gray-400 font-normal">{ageRange}</span>
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onDecrement}
          disabled={value === 0}
          className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-primary-500 hover:text-primary-600 transition-colors disabled:opacity-30"
        >
          <Minus size={13} />
        </button>
        <span className="w-5 text-center text-sm font-semibold text-gray-900">
          {value}
        </span>
        <button
          type="button"
          onClick={onIncrement}
          className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:border-primary-500 hover:text-primary-600 transition-colors"
        >
          <Plus size={13} />
        </button>
      </div>
    </div>
  );
}

export default function HeroQuoteForm() {
  const {
    REGIONS,
    ageCategories,
    journeyType,
    setJourneyType,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    region,
    setRegion,
    group,
    quantity,
    handleQuantityChange,
    setSchemeId,
    setQuoteId,
  } = useContext(InsuranceContext);

  const router = useRouter();
  const { updateLocalStorage } = useLocalStorage();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const totalTravellers =
    quantity.adults + quantity.children + quantity.seniors;

  function validateForm() {
    if (!startDate || !region?.id) {
      toast.error('Please select travel dates and region');
      return false;
    }
    if (journeyType === 'single' && !endDate) {
      toast.error('Please select a return date');
      return false;
    }
    if (totalTravellers === 0) {
      toast.error('Please add at least one traveller');
      return false;
    }
    return true;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;

    setSchemeId(null);
    setQuoteId(null);

    updateLocalStorage('travelInsurance', {
      journeyType,
      startDate,
      endDate,
      region,
      group,
      quantity,
      schemeId: null,
      quoteId: null,
    });

    trackQuoteStarted({
      journeyType,
      startDate,
      endDate,
      region: region?.name,
      adults: quantity.adults,
      children: quantity.children,
      seniors: quantity.seniors,
    });

    pixelLead();

    router.push('/insurance-booking/quote');
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="sr-only">Trip type</label>
        <div className="flex gap-2">
          {[
            { value: 'single', label: 'Single' },
            { value: 'annual', label: '1 Year' },
            { value: 'biennial', label: '2 Years' },
          ].map(({ value, label }) => (
            <label
              key={value}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-sm font-semibold cursor-pointer transition-colors ${
                mounted && journeyType === value
                  ? 'bg-primary-50 text-primary-700 border-primary-300'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
              }`}
            >
              <input
                type="radio"
                name="journeyType"
                value={value}
                checked={mounted && journeyType === value}
                onChange={() => setJourneyType(value)}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="region" className="text-xs text-gray-500 font-medium">
          Destination
        </label>
        <select
          id="region"
          required
          value={region?.id || ''}
          onChange={(e) => {
            const selected = REGIONS.find((r) => r.id === e.target.value);
            if (selected) setRegion(selected);
          }}
          className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        >
          <option value="" disabled>
            Select a region…
          </option>
          {REGIONS.map(({ id, name }) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
        {mounted && region?.id && (
          <p className="text-xs text-gray-400 pl-1">{region.description}</p>
        )}
      </div>

      <div
        className={`grid gap-3 ${mounted && journeyType === 'single' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500 font-medium">
            {mounted && journeyType === 'single' ? 'Departure date' : 'Start date'}
          </label>
          <DatePicker
            value={startDate}
            onChange={setStartDate}
            placeholder="Select date"
            minDate={todayDateOnly()}
            required
          />
        </div>
        {mounted && journeyType === 'single' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500 font-medium">
              Return date
            </label>
            <DatePicker
              value={endDate}
              onChange={setEndDate}
              placeholder="Select date"
              minDate={startDate || todayDateOnly()}
              markedDate={startDate}
              markedLabel="Departure"
              required
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-gray-500 font-medium">
          Travellers
          {totalTravellers > 0 && (
            <span className="ml-1 text-primary-600 font-semibold">
              ({totalTravellers})
            </span>
          )}
        </label>
        <div className="border border-gray-200 rounded-xl px-4 py-3 flex flex-col gap-3">
          {ageCategories.map(({ label, ageRange, field }, i) => (
            <React.Fragment key={i}>
              {i > 0 && (
                <div
                  key={`div-${field}`}
                  className="border-t border-gray-100"
                />
              )}
              <Counter
                key={field}
                label={label}
                ageRange={ageRange}
                value={quantity[field]}
                onDecrement={() => handleQuantityChange(field, -1)}
                onIncrement={() => handleQuantityChange(field, 1)}
              />
            </React.Fragment>
          ))}
        </div>
        {totalTravellers === 0 && (
          <p className="text-xs text-red-400 pl-1">
            Please add at least one traveller
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={totalTravellers === 0}
        className="mt-1 w-full bg-primary-700 hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold py-3.5 rounded-xl text-center transition-colors"
      >
        Get Quotes →
      </button>
    </form>
  );
}
