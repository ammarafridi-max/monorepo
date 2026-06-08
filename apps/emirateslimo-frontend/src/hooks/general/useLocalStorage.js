'use client';

export function useLocalStorage() {
  function updateLocalStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function deleteLocalStorage(key) {
    localStorage.removeItem(key);
  }

  return { updateLocalStorage, deleteLocalStorage };
}
