'use client';

import { createContext, useContext, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { isValidTier, getTier } from '@travel-suite/picturesk-shared/pricing';
import { writeState } from '../../lib/generator';

// What the funnel layout knows server-side and every step needs: who is signed
// in, whether they already used the free plan, and the most recent order whose
// model can be reused. Also lands a `?tier=` from a pricing card into state on
// the first step, so the plan step preselects it.
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

/**
 * Where a step's Continue goes. A step opened from the review page with
 * `?return=review` sends the customer straight back there, so changing one
 * choice never means walking the whole funnel again.
 */
export function useNextHref(defaultHref, reviewHref) {
  const params = useSearchParams();
  return params.get('return') === 'review' ? reviewHref : defaultHref;
}
