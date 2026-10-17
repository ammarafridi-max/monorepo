'use client';

import { createContext, useContext, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { isValidTier, getTier } from '@travel-suite/picturesk-shared/pricing';
import { writeState } from '../../lib/generator';

const FunnelContext = createContext({
  product: 'headshots',
  email: '',
  profile: {},
  freeUsed: false,
  reusable: null,
});

export function FunnelProvider({ product, email, profile = {}, freeUsed, reusable, children }) {
  const params = useSearchParams();
  const tier = params.get('tier');
  useEffect(() => {
    if (tier && isValidTier(tier) && getTier(tier).product === product) writeState({ tier }, product);
  }, [tier, product]);

  return (
    <FunnelContext.Provider value={{ product, email, profile, freeUsed, reusable }}>{children}</FunnelContext.Provider>
  );
}

export function useFunnel() {
  return useContext(FunnelContext);
}

export function useNextHref(defaultHref, reviewHref) {
  const params = useSearchParams();
  return params.get('return') === 'review' ? reviewHref : defaultHref;
}
