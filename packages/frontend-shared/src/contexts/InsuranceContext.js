'use client';

import { createContext, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocalStorage } from '../hooks/general/useLocalStorage.js';
import { compareDateOnly, todayDateOnly } from '../utils/dates.js';
import { createPassenger, getSelectedQuote } from '../utils/insuranceHelpers.js';

function safeParse(key, fallback) {
  try {
    if (typeof window === 'undefined') return fallback;
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function safeGetItem(key, fallback = '') {
  if (typeof window === 'undefined') return fallback;
  return localStorage.getItem(key) || fallback;
}

function areQuotesEqual(leftQuotes = [], rightQuotes = []) {
  if (leftQuotes === rightQuotes) return true;
  if (leftQuotes.length !== rightQuotes.length) return false;

  return leftQuotes.every((quote, index) => {
    const otherQuote = rightQuotes[index];
    return (
      quote?.scheme_id == otherQuote?.scheme_id &&
      quote?.quote_id == otherQuote?.quote_id &&
      Number(quote?.premium) === Number(otherQuote?.premium) &&
      quote?.currency === otherQuote?.currency
    );
  });
}

const PASSENGER_GROUPS = [
  { key: 'adults', label: 'Adult' },
  { key: 'children', label: 'Child' },
  { key: 'seniors', label: 'Senior' },
];

const REGIONS = [
  {
    id: 'gulf',
    name: 'Gulf',
    description:
      'United Arab Emirates, Saudi Arabia, Oman, Kuwait, Jordan, Lebanon, Qatar, Egypt, and Bahrain.',
  },
  {
    id: 'europe',
    name: 'Europe',
    description: 'Europe including Schengen countries.',
  },
  {
    id: 'worldwide_ex',
    name: 'Worldwide (Excluding USA & Canada)',
    description:
      'Worldwide excluding USA, Canada, and all islands in the Caribbean and Bahamas.',
  },
  {
    id: 'worldwide',
    name: 'Worldwide',
    description:
      'Worldwide including USA, Canada, and all islands in the Caribbean and Bahamas.',
  },
  {
    id: 'subcon',
    name: 'Asian Subcontinent',
    description: 'Bangladesh, India, Pakistan, and Sri Lanka.',
  },
];

const groups = [
  { label: 'Individual', value: 'individual' },
  { label: 'Family', value: 'family' },
  { label: 'Group', value: 'group' },
];

const ageCategories = [
  { label: 'Children', ageRange: '(0 - 16)', field: 'children' },
  { label: 'Adults', ageRange: '(17 - 65)', field: 'adults' },
  { label: 'Seniors', ageRange: '(66 - 75)', field: 'seniors' },
];

export const InsuranceContext = createContext();

export function InsuranceProvider({ children }) {
  const searchParams = useSearchParams();
  const { updateLocalStorage } = useLocalStorage();

  const [quoteId, setQuoteId] = useState(null);
  const [schemeId, setSchemeId] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [journeyType, setJourneyType] = useState('single');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [region, setRegion] = useState(REGIONS[0]);
  const [group, setGroup] = useState('individual');
  const [quantity, setQuantity] = useState({
    adults: 1,
    children: 0,
    seniors: 0,
  });
  const [passengers, setPassengers] = useState([]);
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState({ code: '', digits: '' });
  const [streetAddress, setStreetAddress] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');

  useEffect(() => {
    const stored = safeParse('travelInsurance', {});

    if (stored.quoteId !== undefined) setQuoteId(stored.quoteId);
    if (stored.schemeId !== undefined) setSchemeId(stored.schemeId);
    if (stored.sessionId !== undefined) setSessionId(stored.sessionId);
    if (stored.journeyType) setJourneyType(stored.journeyType);
    if (stored.startDate) setStartDate(stored.startDate);
    if (stored.endDate) setEndDate(stored.endDate);
    if (stored.region) setRegion(stored.region);
    if (stored.group) setGroup(stored.group);
    if (stored.quantity) setQuantity(stored.quantity);
    if (stored.passengers?.length) setPassengers(stored.passengers);
    if (stored.streetAddress) setStreetAddress(stored.streetAddress);
    if (stored.addressLine2) setAddressLine2(stored.addressLine2);
    if (stored.city) setCity(stored.city);
    if (stored.country) setCountry(stored.country);

    const storedEmail = safeGetItem('email', '');
    if (storedEmail) setEmail(storedEmail);

    const storedPhone = safeParse('phoneNumber', null);
    if (storedPhone) setMobile(storedPhone);
  }, []);

  const selectedQuote = getSelectedQuote(quotes, schemeId);

  function handleUpdatePassenger(id, field, value) {
    setPassengers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
  }

  function handleEmailChange(e) {
    setEmail(e.target.value);
  }

  function handlePhoneChange(phone) {
    setMobile(phone);
  }

  function handleStreetAddressChange(e) {
    setStreetAddress(e.target.value);
  }

  function handleAddressLine2Change(e) {
    setAddressLine2(e.target.value);
  }

  function handleCityChange(e) {
    setCity(e.target.value);
  }

  function handleCountryChange(e) {
    setCountry(e.target.value);
  }

  function handleStartDateChange(date) {
    setStartDate(date);
    if (endDate && date && compareDateOnly(date, endDate) > 0) {
      setEndDate('');
    }
  }

  function handleQuantityChange(field, delta) {
    setQuantity((prev) => ({
      ...prev,
      [field]: Math.max(0, prev[field] + delta),
    }));
  }

  const handleSetSessionId = useCallback(
    (id) => {
      setSessionId(id);
      updateLocalStorage('travelInsurance', {
        ...safeParse('travelInsurance', {}),
        sessionId: id,
      });
    },
    [updateLocalStorage],
  );

  const handleSetQuotes = useCallback(
    (nextQuotes) => {
      let didChange = false;

      setQuotes((currentQuotes) => {
        if (areQuotesEqual(currentQuotes, nextQuotes)) {
          return currentQuotes;
        }

        didChange = true;
        return nextQuotes;
      });

      if (!didChange) return;

      updateLocalStorage('travelInsurance', {
        ...safeParse('travelInsurance', {}),
        quotes: nextQuotes,
      });
    },
    [updateLocalStorage],
  );

  const handleSelectQuote = useCallback(
    (schemeId, quoteId) => {
      setSchemeId(schemeId);
      setQuoteId(quoteId);

      updateLocalStorage('travelInsurance', {
        ...safeParse('travelInsurance', {}),
        schemeId,
        quoteId,
      });
    },
    [updateLocalStorage],
  );

  useEffect(() => {
    if (!startDate || !endDate) return;
    const today = todayDateOnly();

    if (
      compareDateOnly(startDate, today) < 0 ||
      compareDateOnly(endDate, today) < 0
    ) {
      setStartDate('');
      setEndDate('');
    }
  }, [endDate, startDate]);

  useEffect(() => {
    setPassengers((prevPassengers) =>
      PASSENGER_GROUPS.flatMap((groupItem) =>
        Array.from({ length: quantity[groupItem.key] || 0 }, (_, index) => {
          const existingPassenger = prevPassengers.find(
            (passenger) => passenger.id === `${groupItem.key}-${index + 1}`,
          );

          return createPassenger(groupItem.key, index, existingPassenger);
        }),
      ),
    );
  }, [quantity]);

  useEffect(() => {
    updateLocalStorage('travelInsurance', {
      ...safeParse('travelInsurance', {}),
      quoteId,
      schemeId,
      quotes,
      sessionId,
      journeyType,
      startDate,
      endDate,
      region,
      group,
      quantity,
      passengers,
      streetAddress,
      addressLine2,
      city,
      country,
    });
  }, [
    addressLine2,
    city,
    country,
    endDate,
    group,
    journeyType,
    passengers,
    quantity,
    quoteId,
    quotes,
    region,
    schemeId,
    sessionId,
    startDate,
    streetAddress,
    updateLocalStorage,
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('email', email || '');
  }, [email]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('phoneNumber', JSON.stringify(mobile || {}));
  }, [mobile]);

  return (
    <InsuranceContext.Provider
      value={{
        REGIONS,
        groups,
        ageCategories,

        quoteId,
        schemeId,
        quotes,
        sessionId,
        selectedQuote,
        setSessionId: handleSetSessionId,
        journeyType,
        startDate,
        endDate,
        region,
        group,
        quantity,

        passengers,
        email,
        mobile,
        streetAddress,
        addressLine2,
        city,
        country,

        setQuotes: handleSetQuotes,
        setJourneyType,
        setStartDate: handleStartDateChange,
        setEndDate,
        setRegion,
        setGroup,
        setQuantity,
        setPassengers,
        setEmail,
        setMobile,
        setStreetAddress,
        setAddressLine2,
        setCity,
        setCountry,
        setSchemeId,
        setQuoteId,

        handleEmailChange,
        handlePhoneChange,
        handleStreetAddressChange,
        handleAddressLine2Change,
        handleCityChange,
        handleCountryChange,
        handleQuantityChange,
        handleUpdatePassenger,
        handleSelectQuote,
      }}
    >
      {children}
    </InsuranceContext.Provider>
  );
}
