const DIAL_CODE_COUNTRY = {
  '1242': 'BS',
  1: 'US',
  7: 'RU',
  20: 'EG',
  27: 'ZA',
  30: 'GR',
  31: 'NL',
  32: 'BE',
  33: 'FR',
  34: 'ES',
  36: 'HU',
  39: 'IT',
  40: 'RO',
  41: 'CH',
  43: 'AT',
  44: 'GB',
  45: 'DK',
  46: 'SE',
  47: 'NO',
  48: 'PL',
  49: 'DE',
  52: 'MX',
  54: 'AR',
  55: 'BR',
  58: 'VE',
  60: 'MY',
  61: 'AU',
  62: 'ID',
  63: 'PH',
  64: 'NZ',
  65: 'SG',
  66: 'TH',
  81: 'JP',
  82: 'KR',
  84: 'VN',
  86: 'CN',
  90: 'TR',
  91: 'IN',
  92: 'PK',
  93: 'AF',
  94: 'LK',
  98: 'IR',
  212: 'MA',
  213: 'DZ',
  216: 'TN',
  218: 'LY',
  221: 'SN',
  233: 'GH',
  234: 'NG',
  249: 'SD',
  251: 'ET',
  254: 'KE',
  256: 'UG',
  351: 'PT',
  353: 'IE',
  355: 'AL',
  358: 'FI',
  374: 'AM',
  380: 'UA',
  852: 'HK',
  855: 'KH',
  880: 'BD',
  886: 'TW',
  961: 'LB',
  962: 'JO',
  964: 'IQ',
  965: 'KW',
  966: 'SA',
  968: 'OM',
  971: 'AE',
  972: 'IL',
  973: 'BH',
  974: 'QA',
  994: 'AZ',
};

const digits = (value) => String(value ?? '').replace(/\D/g, '');

function normalizeDialCode(value) {
  const trimmed = String(value ?? '').trim().replace(/^\+/, '').replace(/^00/, '');
  return digits(trimmed);
}

export function dialCodeToCountry(code, { currency } = {}) {
  const key = normalizeDialCode(code);
  if (!key) return undefined;

  const iso = DIAL_CODE_COUNTRY[key];
  if (!iso) return undefined;

  if (iso === 'US' && String(currency ?? '').trim().toUpperCase() === 'CAD') return 'CA';
  return iso;
}

export function genderFromTitle(title) {
  const normalized = String(title ?? '').trim().toLowerCase().replace(/\./g, '');
  if (normalized === 'mr' || normalized === 'master') return 'm';
  if (normalized === 'mrs' || normalized === 'ms' || normalized === 'miss') return 'f';
  return undefined;
}

export function toE164(code, number) {
  const cc = normalizeDialCode(code);
  let national = digits(number);
  if (!cc || !national) return undefined;

  if (national.startsWith(cc) && national.length > cc.length + 4) national = national.slice(cc.length);
  national = national.replace(/^0+/, '');
  if (!national) return undefined;

  const full = `${cc}${national}`;
  return full.length >= 8 && full.length <= 15 ? full : undefined;
}

export function metaClickIdFrom(attribution, { fallbackDate } = {}) {
  for (const touch of [attribution?.last, attribution?.first]) {
    const fbclid = typeof touch?.fbclid === 'string' ? touch.fbclid.trim() : '';
    if (!fbclid) continue;
    const capturedAt = new Date(touch.capturedAt ?? fallbackDate ?? Date.now()).getTime();
    return `fb.1.${Number.isFinite(capturedAt) ? capturedAt : Date.now()}.${fbclid}`;
  }
  return undefined;
}

export function metaUser({
  email,
  phone,
  country,
  externalId,
  title,
  currency,
  firstName,
  lastName,
  attribution,
  metaAttribution,
  createdAt,
} = {}) {
  const dialCode = typeof phone === 'string' ? undefined : phone?.code;
  const national = typeof phone === 'string' ? undefined : phone?.digits ?? phone?.number;
  return {
    email,
    phone: typeof phone === 'string' ? phone : toE164(dialCode, national),
    firstName,
    lastName,
    gender: genderFromTitle(title),
    country: country ?? dialCodeToCountry(dialCode, { currency }),
    externalId: externalId ?? email?.trim().toLowerCase(),
    clientIp: metaAttribution?.clientIp,
    userAgent: metaAttribution?.userAgent,
    fbp: metaAttribution?.fbp,
    fbc: metaAttribution?.fbc || metaClickIdFrom(attribution, { fallbackDate: createdAt }),
  };
}

export { DIAL_CODE_COUNTRY };
