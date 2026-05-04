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

export function pixelLead({ currency = 'AED' } = {}) {
  pixelEvent('Lead', { currency, value: 0 });
}

export function pixelViewContent({
  currency = 'AED',
  value = 0,
  numItems = 0,
} = {}) {
  pixelEvent('ViewContent', { currency, value, num_items: numItems });
}

export function pixelInitiateCheckout({
  currency = 'AED',
  value = 0,
  numItems = 1,
} = {}) {
  pixelEvent('InitiateCheckout', { currency, value, num_items: numItems });
}

export function pixelPurchase({ currency = 'AED', value = 0 } = {}) {
  pixelEvent('Purchase', { currency, value });
}
