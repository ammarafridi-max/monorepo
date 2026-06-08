'use client';
import { createContext, useEffect, useMemo, useState } from 'react';
import { useUserLocationByIp } from '@/hooks/locations/useUserLocationByIp';
import { useCurrencies } from '@/hooks/currencies/useCurrencies';

export const CurrencyContext = createContext();
const COUNTRY_CODE_MAP = {
  USD: ['US'],
  AED: ['AE'],
  EUR: [
    'AT',
    'BE',
    'CY',
    'EE',
    'FI',
    'FR',
    'DE',
    'GR',
    'IE',
    'IT',
    'LV',
    'LT',
    'LU',
    'MT',
    'NL',
    'PT',
    'SK',
    'SI',
    'ES',
    'HR',
  ],
  GBP: ['GB', 'GG', 'JE', 'IM'],
};

export default function CurrencyProvider({ children }) {
  const { userLocation } = useUserLocationByIp();
  const { currencies: apiCurrencies } = useCurrencies();

  const currencies = useMemo(() => {
    if (!apiCurrencies || apiCurrencies.length === 0) return [];

    const baseCurrency =
      apiCurrencies.find((cur) => cur.isBaseCurrency) || apiCurrencies[0];
    const baseRate = baseCurrency?.rate || 1;

    return apiCurrencies.map((cur) => ({
      code: cur.code,
      sign: cur.symbol || cur.code,
      conversionRate: baseRate / (cur.rate || 1),
      countryCodes: COUNTRY_CODE_MAP[cur.code] || [],
    }));
  }, [apiCurrencies]);

  const [currency, setCurrency] = useState(() => {
    if (typeof window === 'undefined') return null;
    const stored = JSON.parse(localStorage.getItem('currency'));
    return stored || null;
  });

  function handleSetCurrency(code, sign, conversionRate) {
    const newCurrency = { code, sign, conversionRate };
    setCurrency(newCurrency);
    localStorage.setItem('currency', JSON.stringify(newCurrency));
  }

  useEffect(() => {
    if (!currencies.length) return;

    const stored = JSON.parse(localStorage.getItem('currency'));
    const storedValid =
      stored && currencies.some((c) => c.code === stored.code);

    if (storedValid) {
      setCurrency(stored);
      return;
    }

    const matched = userLocation
      ? currencies.find((c) => (c.countryCodes || []).includes(userLocation))
      : null;

    const defaultCurrency =
      matched || currencies.find((c) => c.code === 'AED') || currencies[0];
    if (!defaultCurrency) return;

    const newCurrency = {
      code: defaultCurrency.code,
      sign: defaultCurrency.sign,
      conversionRate: defaultCurrency.conversionRate,
    };

    setCurrency(newCurrency);
    localStorage.setItem('currency', JSON.stringify(newCurrency));
  }, [userLocation, currencies]);

  return (
    <CurrencyContext.Provider
      value={{ currencies, currency, setCurrency, handleSetCurrency }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}
