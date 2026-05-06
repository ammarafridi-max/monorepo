'use client';

import { createContext, useContext } from 'react';

export const UserAuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(UserAuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <UserAuthProvider>');
  return ctx;
}
