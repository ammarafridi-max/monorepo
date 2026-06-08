'use client';
import { useContext, useEffect, useRef, useState } from 'react';
import { useOutsideClick } from '../../hooks/general/useOutsideClick';
import { countryCodes } from '../../data/countryCodes';
import { BookingContext } from '../../context/BookingContext';
import Label from './Label';

export default function PhoneNumber({ required, optional, tooltip }) {
  const [query, setQuery] = useState('');
  const [showCodes, setShowCodes] = useState(false);
  const { bookingData, handleNumberChange } = useContext(BookingContext);
  const { bookingDetails } = bookingData;
  const { phoneNumber } = bookingDetails;
  const wrapperRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, [showCodes]);

  useOutsideClick(wrapperRef, () => setShowCodes(false));

  return (
    <div ref={wrapperRef}>
      <Label required={required} optional={optional} tooltip={tooltip}>
        Phone Number
      </Label>
      <div className="flex items-center gap-3 bg-transparent px-3 lg:px-2 rounded-md border border-gray-300 focus:border-primary-900 outline-0">
        <p
          className="w-fit bottom-1.5 left-1 text-[14px] font-light bg-primary-100 px-3 py-1 rounded-sm cursor-pointer"
          onClick={() => setShowCodes((val) => !val)}
        >
          {phoneNumber?.code}
        </p>
        <input
          className="w-full py-2 outline-0 text-[14px] font-light"
          onChange={(e) => handleNumberChange('number', e.target.value)}
        />
      </div>
      <div className="relative">
        {showCodes && (
          <div className="absolute top-1 left-0 w-full h-fit p-3 bg-white rounded-md border border-gray-400 z-50">
            <input
              placeholder="Search for country or code"
              className="w-full text-[14px] font-light border border-gray-300 py-1 px-3 outline-0 rounded-sm"
              value={query}
              ref={searchRef}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
            <div className="divide-y divide-primary-100 h-50 overflow-scroll mt-4">
              {countryCodes
                ?.filter((country) => {
                  const result =
                    country?.country?.toLowerCase().includes(query?.toLowerCase()) ||
                    country?.code?.slice(1)?.includes(query);
                  return result;
                })
                .map((country) => (
                  <p
                    className="font-extralight text-sm py-1.5 px-3 cursor-pointer hover:bg-primary-100 duration-300"
                    onClick={() => {
                      handleNumberChange('code', country.code);
                      setShowCodes(false);
                    }}
                  >
                    {country?.country} ({country?.code})
                  </p>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
