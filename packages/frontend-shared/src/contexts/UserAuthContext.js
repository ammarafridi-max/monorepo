'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { exchangeOAuthSessionApi, getUserMeApi } from '../services/apiAuth.js';

const UserAuthContext = createContext(null);

export function UserAuthProvider({ children }) {
  const [user, setUser]               = useState(null);
  const [isLoadingAuth, setIsLoading] = useState(true);

  const { data: session, status } = useSession();

  const refreshUser = useCallback(async () => {
    try {
      const data = await getUserMeApi();
      setUser(data ?? null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {

    if (status === 'loading') return;

    if (session?.user) {
      exchangeOAuthSessionApi()
        .then((backendUser) => {
          setUser({
            ...(backendUser || {}),
            name: backendUser?.name ?? session.user.name ?? null,
            email: backendUser?.email ?? session.user.email ?? null,
            image: backendUser?.image ?? session.user.image ?? null,
            provider: backendUser?.provider ?? session.user.provider ?? null,
            providerId: backendUser?.providerId ?? session.user.providerId ?? null,
            authProvider: 'oauth',
          });
        })
        .catch(() => {
          setUser({
            name: session.user.name ?? null,
            email: session.user.email ?? null,
            image: session.user.image ?? null,
            provider: session.user.provider ?? null,
            providerId: session.user.providerId ?? null,
            authProvider: 'oauth',
          });
        })
        .finally(() => setIsLoading(false));
    } else {

      refreshUser().finally(() => setIsLoading(false));
    }
  }, [session, status, refreshUser]);

  return (
    <UserAuthContext.Provider
      value={{
        user,
        setUser,
        refreshUser,
        isAuthenticated: !!user,
        isLoadingAuth,
      }}
    >
      {children}
    </UserAuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(UserAuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <UserAuthProvider>');
  return ctx;
}
