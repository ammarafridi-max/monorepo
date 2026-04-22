'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { getAdminMeApi } from '../services/apiAuth.js';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [adminUser, setAdminUser] = useState(null);
  const [isLoadingAdminAuth, setIsLoadingAdminAuth] = useState(true);

  const refreshAdminUser = useCallback(async () => {
    try {
      const data = await getAdminMeApi();
      setAdminUser(data ?? null);
    } catch {
      setAdminUser(null);
    }
  }, []);

  useEffect(() => {
    refreshAdminUser().finally(() => setIsLoadingAdminAuth(false));
  }, [refreshAdminUser]);

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        setAdminUser,
        refreshAdminUser,
        isLoadingAdminAuth,
        isAdminAuthenticated: !!adminUser,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used inside <AdminAuthProvider>');
  }
  return context;
}
