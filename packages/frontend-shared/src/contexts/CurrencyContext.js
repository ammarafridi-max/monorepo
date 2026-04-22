'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useGetCurrencies } from '../hooks/currencies/useGetCurrencies.js';

const SELECTED_CURRENCY_KEY = 'selectedCurrencyCode';

export const CurrencyContext = createContext(null);

function readStoredCurrency() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SELECTED_CURRENCY_KEY);
}

export function CurrencyProvider({ children }) {
  const { currencies: apiCurrencies = [] } = useGetCurrencies();
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState(null);

  useEffect(() => {
    const storedCode = readStoredCurrency();
    if (storedCode) {
      setSelectedCurrencyCode(storedCode);
    }
  }, []);

  useEffect(() => {
    if (!apiCurrencies.length || selectedCurrencyCode) return;

    setSelectedCurrencyCode(
      apiCurrencies.find((currency) => currency.isBaseCurrency)?.code ||
        apiCurrencies[0]?.code ||
        null,
    );
  }, [apiCurrencies, selectedCurrencyCode]);

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

    setSelectedCurrencyCode(nextCode);

    if (typeof window !== 'undefined') {
      localStorage.setItem(SELECTED_CURRENCY_KEY, nextCode);
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

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used inside <CurrencyProvider>');
  }
  return context;
}
