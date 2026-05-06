// Pure function — no imports, no side effects. brand + data → HTML string.

function row(label, value, i) {
  const border = i > 0 ? 'border-top:1px solid #e2e8f0;' : '';
  return `
    <tr>
      <td style="padding:9px 14px;font-size:12px;font-weight:400;color:#94a3b8;width:160px;background:#f8fafc;${border}">${label}</td>
      <td style="padding:9px 14px;font-size:13px;font-weight:400;color:#0f172a;${border}">${value || '—'}</td>
    </tr>`;
}

function section(heading, rows) {
  return `
      <div style="font-size:10px;font-weight:400;color:#94a3b8;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px;">${heading}</div>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:24px;">
        ${rows.map(([label, value], i) => row(label, value, i)).join('')}
      </table>`;
}

export function renderInsurancePaymentTemplate({
  brand,
  leadTraveler,
  email,
  sessionId,
  policyId,
  policyNumber,
  amount,
  currency,
  journeyType,
  startDate,
  endDate,
  region,
  quoteId,
  mobile,
}) {
  const { primaryColor } = brand.theme;
  const travelDates = [startDate, endDate].filter(Boolean).join(' → ') || '—';
  const amountDisplay = [currency, amount].filter(Boolean).join(' ') || '—';
  const summary = [region, journeyType, travelDates].filter(Boolean).join(' · ');

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
    <td style="background:${primaryColor};padding:20px 24px;border-radius:10px 10px 0 0;">
      <div style="font-size:10px;color:#94a3b8;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:6px;">New Insurance Purchase</div>
      <div style="font-size:20px;font-weight:700;color:#ffffff;margin-bottom:4px;">${leadTraveler || '—'}</div>
      <div style="font-size:13px;color:#94a3b8;">${summary}</div>
    </td>
  </tr>

  <!-- BODY -->
  <tr>
    <td style="background:#ffffff;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px;">

      ${section('Customer Details', [
        ['Lead traveler', leadTraveler],
        ['Email', email],
        ['Phone', mobile],
      ])}

      ${section('Payment Details', [
        ['Amount', amountDisplay],
        ['Session ID', sessionId],
        ['Quote ID', quoteId],
      ])}

      ${section('Policy Details', [
        ['Policy ID', policyId],
        ['Policy Number', policyNumber],
      ])}

      ${section('Journey Details', [
        ['Journey type', journeyType],
        ['Travel dates', travelDates],
        ['Region', region],
      ])}

    </td>
  </tr>
</table>

</body>
</html>`;
}
