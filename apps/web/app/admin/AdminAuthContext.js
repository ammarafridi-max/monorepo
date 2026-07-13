'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAdminMe } from '../../lib/adminApi';

/**
 * Holds the current admin session for the guarded admin area. On mount it calls
 * GET /auth/me (the httpOnly cookie is sent automatically); success populates
 * adminUser, a 401 leaves it null. This is the single source of truth for "is an
 * admin logged in, and what role." Scoped to the (dashboard) layout so it hydrates
 * fresh whenever the guarded area is entered (e.g. right after login).
 */
const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setAdminUser(await getAdminMe());
    } catch {
      setAdminUser(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  return (
    <AdminAuthContext.Provider
      value={{ adminUser, setAdminUser, refresh, loading, isAuthed: Boolean(adminUser) }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
