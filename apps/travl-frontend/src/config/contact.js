/**
 * Single source of truth for Travl's public contact details.
 *
 * Imported by the footer (via Providers) and the contact page so the two can
 * never drift apart.
 */

export const EMAIL = 'info@travl.ae';
export const WHATSAPP_NUMBER = '+971569964924';
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}`;

export const ADDRESS = 'Regus, DAFZ, Dubai, UAE';
export const GMB_URL = 'https://maps.app.goo.gl/VAouqUyAvdX1ZZnC6';

export const SOCIALS = [
  { platform: 'facebook', href: 'https://www.facebook.com/travl.ae' },
  { platform: 'instagram', href: 'https://www.instagram.com/travl.uae' },
  { platform: 'tiktok', href: 'https://www.tiktok.com/@travl.ae' },
  { platform: 'maps', href: GMB_URL, label: 'Travl on Google Maps' },
];
