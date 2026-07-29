'use client';

import { useCallback, useEffect, useState } from 'react';
import { UserAuthContext } from './AuthContextBase.js';
import { getCurrentUserApi, logoutUserApi } from '../services/apiVisaApplications.js';

/**
 * Real customer auth provider (userJwt cookie). Fetches the logged-in user from
 * GET /api/users/me on mount and exposes the same context shape the app already
 * uses for the guest value: { user, isAuthenticated, isLoadingAuth, setUser, refreshUser, logout }.
 */
export function UserAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const me = await getCurrentUserApi();
      setUser(me || null);
      return me || null;
    } catch {
      setUser(null);
      return null;
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUserApi();
    } catch {
      /* ignore */
    }
    setUser(null);
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <UserAuthContext.Provider
      value={{ user, isAuthenticated: Boolean(user), isLoadingAuth, setUser, refreshUser, logout }}
    >
      {children}
    </UserAuthContext.Provider>
  );
}

export default UserAuthProvider;
