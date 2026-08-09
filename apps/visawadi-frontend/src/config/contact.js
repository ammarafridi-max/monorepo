/**
 * VisaWadi's public contact details, in one place so the footer, schema and
 * any contact page cannot drift apart.
 *
 * TODO: the values below are placeholders taken from the brand name. Replace
 * the email, WhatsApp number, address and social profiles with the real ones
 * before this site goes live.
 */

export const EMAIL = 'info@visawadi.ae';
export const WHATSAPP_NUMBER = '';
export const WHATSAPP_URL = WHATSAPP_NUMBER
  ? `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}`
  : '';

export const ADDRESS = null;
export const GMB_URL = null;

// Shape: { platform: 'facebook' | 'instagram' | 'tiktok' | 'maps', href, label? }
// An empty list renders no icon row at all.
export const SOCIALS = [];
