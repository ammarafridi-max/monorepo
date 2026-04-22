function fbq(...args) {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq(...args);
  }
}

export function pixelEvent(event, data = {}) {
  fbq('track', event, data);
}

export function pixelCustomEvent(event, data = {}) {
  fbq('trackCustom', event, data);
}

/* --- Typed helpers ----------------------------------------------------------- */

/**
 * Lead — user submitted the quote form.
 * @param {{ currency: string }} params
 */
export function pixelLead({ currency = 'AED' } = {}) {
  pixelEvent('Lead', { currency, value: 0 });
}

/**
 * ViewContent — user saw quote results.
 * @param {{ currency: string, value: number, numItems: number }} params
 */
export function pixelViewContent({
  currency = 'AED',
  value = 0,
  numItems = 0,
} = {}) {
  pixelEvent('ViewContent', { currency, value, num_items: numItems });
}

/**
 * InitiateCheckout — user clicked "Confirm & Pay".
 * @param {{ currency: string, value: number, numItems: number }} params
 */
export function pixelInitiateCheckout({
  currency = 'AED',
  value = 0,
  numItems = 1,
} = {}) {
  pixelEvent('InitiateCheckout', { currency, value, num_items: numItems });
}

/**
 * Purchase — payment confirmed and policy issued.
 * @param {{ currency: string, value: number }} params
 */
export function pixelPurchase({ currency = 'AED', value = 0 } = {}) {
  pixelEvent('Purchase', { currency, value });
}
