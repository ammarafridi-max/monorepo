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
    const nextCode =
      known(chosenCodeRef.current) ||
      known(readStoredCurrency()) ||
      known(defaultCode) ||
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
        currency: sourceCurrencyCode || 'AED',
      };
    }

    const baseCurrency =
      apiCurrencies.find((currency) => currency.isBaseCurrency) ||
      apiCurrencies[0];
    const sourceCurrency =
      apiCurrencies.find((currency) => currency.code === sourceCurrencyCode) ||
      baseCurrency;
    const targetCurrency = selectedCurrency;

    const baseAmount = sourceCurrency.isBaseCurrency
      ? numericAmount
      : numericAmount / Number(sourceCurrency.rate || 1);

    const convertedAmount = targetCurrency.isBaseCurrency
      ? baseAmount
      : baseAmount * Number(targetCurrency.rate || 1);

    return {
      amount: convertedAmount,
      currency: targetCurrency.code,
      symbol: targetCurrency.symbol,
    };
  }

  function formatMoney(amount, sourceCurrencyCode) {
    const converted = convertAmount(amount, sourceCurrencyCode);

    if (!converted) {
      return {
        code: sourceCurrencyCode || 'AED',
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
    const currency = sourceCurrencyCode || 'AED';
    return { amount: numericAmount, currency, symbol: currency };
  },
  formatMoney: (amount, sourceCurrencyCode) => {
    const numericAmount = Number(amount);
    const code = sourceCurrencyCode || 'AED';
    if (!Number.isFinite(numericAmount)) return { code, value: '0.00', amount: 0 };
    return { code, symbol: code, amount: numericAmount, value: numericAmount.toFixed(2) };
  },
};

export function useCurrency() {
  return useContext(CurrencyContext) || SINGLE_CURRENCY;
}
