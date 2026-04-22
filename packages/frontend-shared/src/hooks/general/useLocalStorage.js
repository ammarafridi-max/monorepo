'use client';
import { useCallback } from 'react';

export function useLocalStorage() {
  const getLocalStorage = useCallback((key) => {
    if (typeof window === 'undefined') return null;
    return JSON.parse(localStorage.getItem(key));
  }, []);

  const updateLocalStorage = useCallback((key, value) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  }, []);

  const deleteLocalStorage = useCallback((key) => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  }, []);

  return { getLocalStorage, updateLocalStorage, deleteLocalStorage };
}
