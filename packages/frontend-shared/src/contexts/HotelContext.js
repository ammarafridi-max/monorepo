'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { compareDateOnly, todayDateOnly } from '../utils/dates.js';

const SEARCH_STORAGE_KEY = 'hotel_search_v1';
const AFFILIATE_STORAGE_KEY = 'affiliate_attribution_v1';

function safeParse(key, fallback, storage = 'local') {
  try {
    if (typeof window === 'undefined') return fallback;
    const store = storage === 'session' ? sessionStorage : localStorage;
    const value = store.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function isValidAffiliateId(value) {
  return /^\d{9}$/.test(value || '');
}

function getStoredAttribution() {
  const value = safeParse(AFFILIATE_STORAGE_KEY, null);
  if (!value || !isValidAffiliateId(value.affiliateId)) return null;
  if (!value.expiresAt || new Date(value.expiresAt).getTime() <= Date.now()) return null;
  return value;
}

export const HotelContext = createContext();

export function useHotelContext() {
  const context = useContext(HotelContext);
  if (!context) throw new Error('useHotelContext must be used inside a HotelProvider');
  return context;
}

export function HotelProvider({ children }) {
  const pathname = usePathname();

  const [cityName, setCityName] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [occupancy, setOccupancy] = useState({ rooms: 1, adults: 2, children: [] });
  const [guestNationality, setGuestNationality] = useState('');
  const [guests, setGuests] = useState([]);
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState({ code: '', digits: '' });
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [affiliateAttribution, setAffiliateAttribution] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  const initializeGuests = useCallback((rooms) => {
    setGuests((current) => {
      const count = Math.max(1, Number(rooms) || 1);
      if (current.length === count) return current;
      return Array.from({ length: count }, (_, i) => current[i] ?? {
        title: '',
        firstName: '',
        lastName: '',
        isLead: i === 0,
      });
    });
  }, []);

  const updateGuestData = useCallback((index, field, value) => {
    setGuests((current) => {
      const next = [...current];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }, []);

  useEffect(() => {
    const saved = safeParse(SEARCH_STORAGE_KEY, null, 'session');
    if (saved) {
      if (saved.cityName) setCityName(saved.cityName);
      if (saved.countryCode) setCountryCode(saved.countryCode);
      if (saved.checkIn) setCheckIn(saved.checkIn);
      if (saved.checkOut) setCheckOut(saved.checkOut);
      if (saved.occupancy) setOccupancy(saved.occupancy);
      if (saved.guestNationality) setGuestNationality(saved.guestNationality);
      if (saved.selectedOffer) setSelectedOffer(saved.selectedOffer);
    }
    setAffiliateAttribution(getStoredAttribution());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(
        SEARCH_STORAGE_KEY,
        JSON.stringify({ cityName, countryCode, checkIn, checkOut, occupancy, guestNationality, selectedOffer }),
      );
    } catch {}
  }, [hydrated, cityName, countryCode, checkIn, checkOut, occupancy, guestNationality, selectedOffer]);

  useEffect(() => {
    const today = todayDateOnly();
    if (checkIn && compareDateOnly(checkIn, today) < 0) setCheckIn('');
    if (checkOut && compareDateOnly(checkOut, today) <= 0) setCheckOut('');
  }, [checkIn, checkOut]);

  useEffect(() => {
    setAffiliateAttribution(getStoredAttribution());
  }, [pathname]);

  return (
    <HotelContext.Provider
      value={{
        cityName,
        countryCode,
        checkIn,
        checkOut,
        occupancy,
        guestNationality,
        guests,
        email,
        phoneNumber,
        selectedOffer,
        affiliateAttribution,
        hydrated,

        setCityName,
        setCountryCode,
        setCheckIn,
        setCheckOut,
        setOccupancy,
        setGuestNationality,
        setGuests,
        setEmail,
        setPhoneNumber,
        setSelectedOffer,

        initializeGuests,
        updateGuestData,
      }}
    >
      {children}
    </HotelContext.Provider>
  );
}
