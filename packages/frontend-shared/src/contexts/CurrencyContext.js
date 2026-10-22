'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useGetCurrencies } from '../hooks/currencies/useGetCurrencies.js';
import { guessVisitorCurrency } from '../utils/geoCurrency.js';

const SELECTED_CURRENCY_KEY = 'selectedCurrencyCode';

export const CurrencyContext = createContext(null);

function readStoredCurrency() {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(SELECTED_CURRENCY_KEY);
  } catch {
    return null;
  }
}

export function CurrencyProvider({
  children,
  defaultCode,
  detectCurrency = false,
}) {
  const { currencies: apiCurrencies = [] } = useGetCurrencies();
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState(null);
  const chosenCodeRef = useRef(null);
  const detectedCode = useMemo(
    () => (detectCurrency ? guessVisitorCurrency() : undefined),
    [detectCurrency],
  );

  useEffect(() => {
    if (!apiCurrencies.length) return;

    const known = (code) => apiCurrencies.find((currency) => currency.code === code)?.code;
    // defaultCode comes from the locale in the URL, so it outranks a currency stored on an earlier visit.
    const nextCode =
      known(chosenCodeRef.current) ||
      known(defaultCode) ||
      known(readStoredCurrency()) ||
      known(detectedCode) ||
      apiCurrencies.find((currency) => currency.isBaseCurrency)?.code ||
      apiCurrencies[0]?.code ||
      null;

    if (nextCode && nextCode !== selectedCurrencyCode) {
      setSelectedCurrencyCode(nextCode);
    }
  }, [apiCurrencies, defaultCode, detectedCode, selectedCurrencyCode]);

  const selectedCurrency = useMemo(
    () =>
      apiCurrencies.find(
        (currency) => currency.code === selectedCurrencyCode,
      ) ||
      apiCurrencies.find((currency) => currency.isBaseCurrency) ||
      apiCurrencies[0] ||
      null,
    [apiCurrencies, selectedCurrencyCode],
  );

  function setCurrency(nextCurrency) {
    const nextCode =
      typeof nextCurrency === 'string' ? nextCurrency : nextCurrency?.code;
    if (!nextCode) return;

    chosenCodeRef.current = nextCode;
    setSelectedCurrencyCode(nextCode);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(SELECTED_CURRENCY_KEY, nextCode);
      } catch {}
    }
  }

  function convertAmount(amount, sourceCurrencyCode) {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount)) return null;

    if (!apiCurrencies.length || !selectedCurrency) {
      return {
        amount: numericAmount,
        currency: sourceCurrencyCode || null,
      };
    }

    const baseCurrency =
      apiCurrencies.find((currency) => currency.isBaseCurrency) ||
      apiCurrencies[0];
    const sourceCurrency =
      apiCurrencies.find((currency) => currency.code === sourceCurrencyCode) ||
      baseCurrency;
    const targetCurrency = selectedCurrency;

    const usableRate = (currency) => {
      const rate = Number(currency?.rate);
      return Number.isFinite(rate) && rate > 0 ? rate : null;
    };

    const sourceRate = sourceCurrency.isBaseCurrency ? 1 : usableRate(sourceCurrency);
    const targetRate = targetCurrency.isBaseCurrency ? 1 : usableRate(targetCurrency);

    // A missing or broken rate must not quietly pass the amount through as if it converted.
    if (sourceRate === null || targetRate === null) {
      return {
        amount: numericAmount,
        currency: sourceCurrency.code,
        symbol: sourceCurrency.symbol,
      };
    }

    return {
      amount: (numericAmount / sourceRate) * targetRate,
      currency: targetCurrency.code,
      symbol: targetCurrency.symbol,
    };
  }

  function formatMoney(amount, sourceCurrencyCode) {
    const converted = convertAmount(amount, sourceCurrencyCode);

    if (!converted) {
      return {
        code: sourceCurrencyCode || null,
        value: '0.00',
        amount: 0,
      };
    }

    return {
      code: converted.currency,
      symbol: converted.symbol,
      amount: converted.amount,
      value: converted.amount.toFixed(2),
    };
  }

  return (
    <CurrencyContext.Provider
      value={{
        currencies: apiCurrencies,
        selectedCurrency,
        setCurrency,
        convertAmount,
        formatMoney,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

const SINGLE_CURRENCY = {
  currencies: [],
  selectedCurrency: null,
  setCurrency: () => {},
  convertAmount: (amount, sourceCurrencyCode) => {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount)) return null;
    const currency = sourceCurrencyCode || null;
    return { amount: numericAmount, currency, symbol: currency };
  },
  formatMoney: (amount, sourceCurrencyCode) => {
    const numericAmount = Number(amount);
    const code = sourceCurrencyCode || null;
    if (!Number.isFinite(numericAmount)) return { code, value: '0.00', amount: 0 };
    return { code, symbol: code, amount: numericAmount, value: numericAmount.toFixed(2) };
  },
};

export function useCurrency() {
  return useContext(CurrencyContext) || SINGLE_CURRENCY;
}
