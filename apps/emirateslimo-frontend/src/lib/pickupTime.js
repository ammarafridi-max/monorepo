export const MIN_LEAD_MINUTES = 120;
const GST_OFFSET_MINUTES = 4 * 60;

export const TIME_SLOTS = Array.from({ length: 96 }, (_, i) => {
  const hours24 = Math.floor(i / 4);
  const minutes = (i % 4) * 15;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
});

// pickupDate is YYYY-MM-DD and pickupTime is "hh:mm AM" in Gulf time, which has no DST.
export function pickupInstant(pickupDate, pickupTime) {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(pickupDate || ''));
  const t = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(String(pickupTime || '').trim());
  if (!d || !t) return null;
  let hours = Number(t[1]) % 12;
  if (t[3].toUpperCase() === 'PM') hours += 12;
  return new Date(Date.UTC(Number(d[1]), Number(d[2]) - 1, Number(d[3]), hours, Number(t[2])) - GST_OFFSET_MINUTES * 60000);
}

export function isTooSoon(pickupDate, pickupTime) {
  const instant = pickupInstant(pickupDate, pickupTime);
  return !instant || instant.getTime() - Date.now() < MIN_LEAD_MINUTES * 60000;
}

export const LEAD_TIME_MESSAGE = `Pickups need at least ${MIN_LEAD_MINUTES / 60} hours' notice. For anything sooner, message us on WhatsApp.`;
