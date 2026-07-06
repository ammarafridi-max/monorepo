import { formatToDDMMMYYYYMixed } from '../helpers.js';

function formatTime(str) {
  if (!str) return '—';
  const [h, min] = String(str).split(':').map(Number);
  const period = h < 12 ? 'AM' : 'PM';
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:${String(min).padStart(2, '0')} ${period}`;
}

function row(label, value, i) {
  const border = i > 0 ? 'border-top:1px solid #e2e8f0;' : '';
  return `
    <tr>
      <td style="padding:9px 14px;font-size:12px;font-weight:400;color:#94a3b8;width:140px;background:#f8fafc;${border}">${label}</td>
      <td style="padding:9px 14px;font-size:13px;font-weight:400;color:#0f172a;${border}">${value || '—'}</td>
    </tr>`;
}

export function renderBookingPaymentAdminTemplate({
  brand,
  firstName,
  lastName,
  email,
  countryCode,
  phone,
  flightNumber,
  specialRequests,
  bookingRef,
  pickup,
  dropoff,
  date,
  time,
  passengers,
  luggage,
  vehicleName,
  vehicleClass,
  price,
  bookingId,
}) {
  const { primaryColor, accentColor } = brand.theme;
  const fullName = `${firstName || ''} ${lastName || ''}`.trim() || 'Unknown';
  const dateFmt = formatToDDMMMYYYYMixed(date);
  const timeFmt = formatTime(time);
  const priceStr = price ? `${String(price.currency || '').toUpperCase()} ${price.amount}` : '—';
  const phoneStr = countryCode && phone ? `${countryCode} ${phone}` : phone || '—';
  const paxLine = passengers ? `${passengers} pax${luggage ? `, ${luggage} bags` : ''}` : '—';

  const tripRows = [
    ['Pick up',   pickup],
    ['Drop off',  dropoff],
    ['Date',      dateFmt],
    ['Time',      timeFmt],
    ['Passengers', paxLine],
    ['Vehicle',   vehicleName ? `${vehicleName}${vehicleClass ? ` · ${vehicleClass}` : ''}` : null],
    ['Amount',    priceStr],
  ].map(([label, value], i) => row(label, value, i)).join('');

  const passengerRows = [
    ['Name',    fullName],
    ['Email',   email],
    ['Phone',   phoneStr],
    flightNumber ? ['Flight', flightNumber] : null,
    specialRequests ? ['Notes', specialRequests] : null,
  ].filter(Boolean).map(([label, value], i) => row(label, value, i)).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:24px 0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">

<table width="600" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">

  <tr>
    <td style="background:${primaryColor};padding:20px 24px;border-radius:10px 10px 0 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <div style="font-size:10px;color:#94a3b8;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;">New Booking Payment</div>
            <div style="font-size:20px;font-weight:700;color:#ffffff;margin-bottom:4px;">${fullName}</div>
            <div style="font-size:13px;color:#94a3b8;">${dateFmt} &nbsp;&middot;&nbsp; ${timeFmt} &nbsp;&middot;&nbsp; ${paxLine}</div>
          </td>
          <td style="text-align:right;vertical-align:top;">
            <div style="background:${accentColor};color:#fff;font-size:10px;font-weight:700;padding:5px 14px;border-radius:20px;letter-spacing:1px;display:inline-block;">PAID</div>
            <div style="margin-top:8px;font-size:20px;font-weight:700;color:#ffffff;">${priceStr}</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <tr>
    <td style="background:#ffffff;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px;">

      <div style="font-size:10px;font-weight:400;color:#94a3b8;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px;">Trip Details</div>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:20px;">
        ${tripRows}
      </table>

      <div style="font-size:10px;font-weight:400;color:#94a3b8;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px;">Passenger</div>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:20px;">
        ${passengerRows}
      </table>

      <div style="font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:16px;">
        Booking ID: <span style="font-family:monospace;color:#475569;">${bookingRef || bookingId || '—'}</span>
      </div>

    </td>
  </tr>
</table>

</body>
</html>`;
}
