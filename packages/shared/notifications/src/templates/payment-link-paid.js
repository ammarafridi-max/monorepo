// Pure function — no imports, no side effects. brand + data → HTML string.

function row(label, value, i) {
  const border = i > 0 ? 'border-top:1px solid #e2e8f0;' : '';
  return `
    <tr>
      <td style="padding:9px 14px;font-size:12px;font-weight:400;color:#94a3b8;width:160px;background:#f8fafc;${border}">${label}</td>
      <td style="padding:9px 14px;font-size:13px;font-weight:400;color:#0f172a;${border}">${value || '—'}</td>
    </tr>`;
}

export function renderPaymentLinkPaidTemplate({
  brand,
  amountFormatted,
  payerName,
  payerEmail,
  description,
  createdByName,
  paymentLinkId,
  sessionId,
  paidAt,
}) {
  const primary = brand?.theme?.primaryColor || '#1a1a2e';
  const teamName = brand?.teamName || 'Team';

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Custom payment received</title>
</head>
<body style="margin:0;padding:24px 12px;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
          <tr>
            <td style="padding:24px 28px;background:${primary};">
              <p style="margin:0;color:rgba(255,255,255,0.7);font-size:11px;letter-spacing:1.6px;text-transform:uppercase;">Custom payment link</p>
              <h1 style="margin:6px 0 0;color:#ffffff;font-size:22px;font-weight:600;letter-spacing:-0.2px;">Payment received</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 6px;color:#475569;font-size:13px;">Amount paid</p>
              <p style="margin:0 0 24px;color:#0f172a;font-size:30px;font-weight:600;letter-spacing:-0.4px;">${amountFormatted}</p>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:20px;">
                ${row('Paid by', payerName, 0)}
                ${row('Email', payerEmail, 1)}
                ${row('Description', description, 2)}
                ${row('Created by', createdByName, 3)}
                ${row('Paid at', paidAt, 4)}
                ${row('Payment link', paymentLinkId, 5)}
                ${row('Session', sessionId, 6)}
              </table>

              <p style="margin:0;color:#64748b;font-size:12px;line-height:1.6;">
                This was paid via a custom payment link generated from the admin panel.
                ${brand?.name ? `Forwarded automatically by ${brand.name}.` : ''}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:11px;">${teamName}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
