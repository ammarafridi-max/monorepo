export const EMAIL = "info@visawadi.com";

/**
 * VisaWadi is a brand of City Tours LLC. The trade licence number and the
 * registered address are deliberately not published here yet: licence 557984
 * expired 17/05/2026, and its registered address is in Sharjah while the site
 * copy says Dubai throughout. Both need resolving before either goes live.
 */
export const LEGAL_NAME = "City Tours LLC";
export const WHATSAPP_NUMBER = "+971569964924";
export const WHATSAPP_URL = WHATSAPP_NUMBER
  ? `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, "")}`
  : "";

export const ADDRESS = null;
export const GMB_URL = null;

export const SOCIALS = [
  { platform: "facebook", href: "https://www.facebook.com/visawadi01" },
  { platform: "instagram", href: "https://www.instagram.com/visawadi" },
  { platform: "tiktok", href: "https://www.tiktok.com/@visawadi" },
];
