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
      <td style="padding:9px 14px;font-size:12px;font-weight:400;color:#94a3b8;width:120px;background:#f8fafc;${border}">${label}</td>
      <td style="padding:9px 14px;font-size:13px;font-weight:400;color:#0f172a;${border}">${value || '—'}</td>
    </tr>`;
}

export function renderBookingPaymentTemplate({
  brand,
  firstName,
  lastName,
  email,
  bookingRef,
  pickup,
  dropoff,
  date,
  time,
  passengers,
  vehicleName,
  vehicleClass,
  price,
  flightNumber,
}) {
  const { primaryColor, accentColor } = brand.theme;
  const fullName = `${firstName || ''} ${lastName || ''}`.trim() || 'Customer';
  const dateFmt = formatToDDMMMYYYYMixed(date);
  const timeFmt = formatTime(time);
  const priceStr = price ? `${String(price.currency || '').toUpperCase()} ${price.amount}` : '—';
  const paxLine = passengers ? `${passengers} ${passengers === 1 ? 'passenger' : 'passengers'}` : '—';

  const bookingRows = [
    ['Pick up',   pickup],
    ['Drop off',  dropoff],
    ['Date',      dateFmt],
    ['Time',      timeFmt],
    ['Passengers', paxLine],
    ['Vehicle',   vehicleName ? `${vehicleName}${vehicleClass ? ` · ${vehicleClass}` : ''}` : null],
    flightNumber ? ['Flight', flightNumber] : null,
  ].filter(Boolean).map(([label, value], i) => row(label, value, i)).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:24px 0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">

<table width="600" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">

  <!-- HEADER -->
  <tr>
    <td style="background:${primaryColor};padding:24px;border-radius:10px 10px 0 0;">
      <div style="font-size:10px;color:#94a3b8;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;">Booking Confirmed</div>
      <div style="font-size:22px;font-weight:700;color:#ffffff;margin-bottom:4px;">${fullName}</div>
      <div style="font-size:13px;color:#94a3b8;">Airport Transfer · ${dateFmt}</div>
      <div style="margin-top:14px;">
        <span style="background:${accentColor};color:#fff;font-size:11px;font-weight:700;padding:5px 14px;border-radius:20px;letter-spacing:1px;display:inline-block;">
          REF ${bookingRef || '—'}
        </span>
      </div>
    </td>
  </tr>

  <!-- BODY -->
  <tr>
    <td style="background:#ffffff;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px;">

      <div style="font-size:13px;color:#475569;margin-bottom:20px;line-height:1.6;">
        Hi ${firstName || 'there'},<br><br>
        Your airport transfer is confirmed and paid. Here are your booking details:
      </div>

      <!-- BOOKING DETAILS -->
      <div style="font-size:10px;font-weight:400;color:#94a3b8;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px;">Booking Details</div>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:24px;">
        ${bookingRows}
      </table>

      <!-- PRICE -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:24px;">
        <tr>
          <td style="padding:12px 14px;font-size:13px;color:#475569;">Total paid</td>
          <td style="padding:12px 14px;font-size:18px;font-weight:700;color:#0f172a;text-align:right;">${priceStr}</td>
        </tr>
      </table>

      <!-- WHAT HAPPENS NEXT -->
      <div style="font-size:10px;font-weight:400;color:#94a3b8;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px;">What Happens Next</div>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:24px;">
        <tr>
          <td style="padding:12px 14px;font-size:13px;color:#475569;border-bottom:1px solid #e2e8f0;">
            <strong style="color:#0f172a;">Driver assignment</strong><br>
            Your driver will be assigned and you'll receive their name, photo, and contact at least 2 hours before pickup.
          </td>
        </tr>
        <tr>
          <td style="padding:12px 14px;font-size:13px;color:#475569;">
            <strong style="color:#0f172a;">Flight tracking</strong><br>
            We monitor your flight in real time. If it's delayed, your driver adjusts automatically — no extra charge.
          </td>
        </tr>
      </table>

      <div style="font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:16px;">
        If you have any questions, reply to this email or visit <a href="${brand.website}" style="color:${primaryColor};">${brand.website}</a>.<br><br>
        The ${brand.name} team
      </div>

    </td>
  </tr>
</table>

</body>
</html>`;
}
