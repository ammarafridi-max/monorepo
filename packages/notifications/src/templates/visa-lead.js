// Pure function — no imports, no side effects. brand + data → HTML string.

function row(label, value, i) {
  const border = i > 0 ? 'border-top:1px solid #e2e8f0;' : '';
  return `
    <tr>
      <td style="padding:9px 14px;font-size:12px;font-weight:400;color:#94a3b8;width:160px;background:#f8fafc;${border}">${label}</td>
      <td style="padding:9px 14px;font-size:13px;font-weight:400;color:#0f172a;${border}">${value || '—'}</td>
    </tr>`;
}

function formatSource(source) {
  const map = {
    hero_cta:    'Hero CTA',
    package_card: 'Package card',
    final_cta:   'Bottom CTA',
  };
  return map[source] || source || '—';
}

function formatSubmittedAt(date) {
  if (!date) return '—';
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
      timeZone: 'Asia/Dubai',
      hour12: true,
    }).format(new Date(date));
  } catch {
    return String(date);
  }
}

export function renderVisaLeadTemplate({
  brand,
  leadId,
  firstName,
  lastName,
  nationality,
  email,
  phone,
  packageRequested,
  applicantCount,
  visaCountryName,
  source,
  submittedAt,
}) {
  const primary  = brand?.theme?.primaryColor || '#1a1a2e';
  const website  = brand?.website || 'https://travl.ae';
  const teamName = brand?.teamName || 'Travl Team';
  const crmUrl   = `${website}/admin/visa-leads/${leadId}`;
  const fullName = `${firstName || ''} ${lastName || ''}`.trim();

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>New visa lead</title>
</head>
<body style="margin:0;padding:24px 12px;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04);">

          <!-- HEADER -->
          <tr>
            <td style="padding:24px 28px;background:${primary};">
              <p style="margin:0;color:rgba(255,255,255,0.7);font-size:11px;letter-spacing:1.6px;text-transform:uppercase;">New visa lead from Travl</p>
              <h1 style="margin:6px 0 4px;color:#ffffff;font-size:22px;font-weight:600;letter-spacing:-0.2px;">${fullName}</h1>
              <p style="margin:0;color:rgba(255,255,255,0.7);font-size:13px;">${visaCountryName || '—'} Visa · ${formatSource(source)}</p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:28px;">

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:24px;">
                ${row('Name',                 fullName,                          0)}
                ${row('Nationality',          nationality,                       1)}
                ${row('Email',                email,                             2)}
                ${row('Phone',                phone,                             3)}
                ${row('Package',              packageRequested,                  4)}
                ${row('Number of applicants', String(applicantCount ?? '—'),     5)}
                ${row('Visa',                 visaCountryName,                   6)}
                ${row('Source',               formatSource(source),              7)}
                ${row('Submitted',            formatSubmittedAt(submittedAt),    8)}
              </table>

              <!-- CTA button -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                <tr>
                  <td align="center" style="border-radius:8px;background:${primary};">
                    <a href="${crmUrl}"
                       style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;letter-spacing:0.2px;">
                      View in CRM →
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:14px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:11px;line-height:1.6;">
                ${teamName} · <a href="${website}" style="color:#94a3b8;">${website}</a><br />
                This notification was sent automatically. Do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
