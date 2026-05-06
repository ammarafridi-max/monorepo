const REQUIRED_STRINGS = [
  'key', 'name', 'domain', 'cloudinaryFolder', 'currency', 'timezone', 'locale',
];
const REQUIRED_EMAILS = ['from', 'support', 'noReply'];
const REQUIRED_THEME = ['primaryColor', 'accentColor'];
const REQUIRED_FEATURES = ['dummyTickets', 'insurance', 'hotelVouchers'];
const REQUIRED_SEO = ['titleTemplate', 'defaultTitle', 'defaultDescription', 'ogImage'];
const REQUIRED_LEGAL = ['companyName', 'address'];

export function validateBrand(config) {
  const errors = [];

  for (const field of REQUIRED_STRINGS) {
    if (typeof config[field] !== 'string' || !config[field]) {
      errors.push(`missing or empty: ${field}`);
    }
  }
  for (const field of REQUIRED_EMAILS) {
    if (typeof config.emails?.[field] !== 'string' || !config.emails[field]) {
      errors.push(`missing or empty: emails.${field}`);
    }
  }
  for (const field of REQUIRED_THEME) {
    if (typeof config.theme?.[field] !== 'string' || !config.theme[field]) {
      errors.push(`missing or empty: theme.${field}`);
    }
  }
  for (const field of REQUIRED_FEATURES) {
    if (typeof config.features?.[field] !== 'boolean') {
      errors.push(`missing or non-boolean: features.${field}`);
    }
  }
  for (const field of REQUIRED_SEO) {
    if (typeof config.seo?.[field] !== 'string' || !config.seo[field]) {
      errors.push(`missing or empty: seo.${field}`);
    }
  }
  for (const field of REQUIRED_LEGAL) {
    if (typeof config.legal?.[field] !== 'string' || !config.legal[field]) {
      errors.push(`missing or empty: legal.${field}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Invalid brand config for "${config.key ?? '(unknown)'}":
${errors.map((e) => `  - ${e}`).join('\n')}`
    );
  }
}
