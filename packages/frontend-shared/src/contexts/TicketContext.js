'use client';

import { createContext, useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { compareDateOnly, todayDateOnly } from '../utils/dates.js';

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

export const TicketContext = createContext();
const AFFILIATE_STORAGE_KEY = 'affiliate_attribution_v1';
const AFFILIATE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function isValidAffiliateId(value) {
  return /^\d{9}$/.test(value || '');
}

function getStoredAttribution() {
  const value = safeParse(AFFILIATE_STORAGE_KEY, null);
  if (!value || !isValidAffiliateId(value.affiliateId)) return null;
  if (!value.expiresAt || new Date(value.expiresAt).getTime() <= Date.now()) return null;
  return value;
}

export function TicketProvider({ children }) {
  const pathname = usePathname();
  const storedPhone = safeParse('phoneNumber', { code: '', digits: '' });
  const storedEmail = safeGetItem('email', '');
  const storedAffiliate = getStoredAttribution();

  const [type, setType] = useState('One Way');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState(type === 'One Way' ? '' : '');
  const [quantity, setQuantity] = useState({ adults: 1, children: 0, infants: 0 });
  const [ticketPrice, setTicketPrice] = useState(49);
  const [passengers, setPassengers] = useState([]);
  const [email, setEmail] = useState(storedEmail);
  const [phoneNumber, setPhoneNumber] = useState(storedPhone);
  const [ticketValidity, setTicketValidity] = useState('2 Days');
  const [receiveNow, setReceiveNow] = useState(true);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [message, setMessage] = useState('');
  const [departureFlight, setDepartureFlight] = useState('');
  const [returnFlight, setReturnFlight] = useState('');
  const [affiliateAttribution, setAffiliateAttribution] = useState(storedAffiliate);

  const initializePassengers = useCallback((quantity) => {
    const newPassengers = [];
    [
      ['Adult', quantity.adults],
      ['Child', quantity.children],
      ['Infant', quantity.infants],
    ].forEach(([type, count]) => {
      for (let i = 0; i < count; i++) {
        newPassengers.push({
          type,
          title: 'Mr.',
          firstName: '',
          lastName: '',
        });
      }
    });
    setPassengers(newPassengers);
  }, []);

  const updatePassengerData = useCallback((index, field, value) => {
    setPassengers((currentPassengers) => {
      const updatedPassengers = [...currentPassengers];
      updatedPassengers[index] = { ...updatedPassengers[index], [field]: value };
      return updatedPassengers;
    });
  }, []);

  const updatePricing = useCallback(({ ticketValidity, ticketPrice }) => {
    setTicketValidity(ticketValidity);
    setTicketPrice(ticketPrice);
  }, []);

  useEffect(() => {
    const today = todayDateOnly();
    if (departureDate && compareDateOnly(departureDate, today) <= 0) setDepartureDate('');
    if (returnDate && compareDateOnly(returnDate, today) <= 0) setReturnDate('');
  }, [departureDate, returnDate]);

  useEffect(() => {
    const params =
      typeof window === 'undefined' ? new URLSearchParams() : new URLSearchParams(window.location.search);
    const incomingAffiliateId = params.get('affId');
    const current = getStoredAttribution();

    if (incomingAffiliateId && isValidAffiliateId(incomingAffiliateId)) {
      if (current?.affiliateId && current.expiresAt && new Date(current.expiresAt).getTime() > Date.now()) {
        setAffiliateAttribution(current);
        return;
      }

      const next = {
        affiliateId: incomingAffiliateId,
        source: 'query',
        capturedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + AFFILIATE_TTL_MS).toISOString(),
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem(AFFILIATE_STORAGE_KEY, JSON.stringify(next));
      }
      setAffiliateAttribution(next);
      return;
    }

    if (!current) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(AFFILIATE_STORAGE_KEY);
      }
      setAffiliateAttribution(null);
      return;
    }

    setAffiliateAttribution(current);
  }, [pathname]);

  return (
    <TicketContext.Provider
      value={{
        type,
        from,
        to,
        departureDate,
        returnDate,
        quantity,
        ticketPrice,
        passengers,
        email,
        phoneNumber,
        ticketValidity,
        receiveNow,
        deliveryDate,
        message,
        departureFlight,
        returnFlight,
        affiliateAttribution,

        setType,
        setFrom,
        setTo,
        setDepartureDate,
        setReturnDate,
        setQuantity,
        setTicketPrice,
        setPassengers,
        setEmail,
        setPhoneNumber,
        setTicketValidity,
        setReceiveNow,
        setDeliveryDate,
        setMessage,
        setDepartureFlight,
        setReturnFlight,

        initializePassengers,
        updatePassengerData,
        updatePricing,
      }}
    >
      {children}
    </TicketContext.Provider>
  );
}
