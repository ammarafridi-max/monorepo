const FONT = "font-family:Commissioner,'Helvetica Neue',Arial,sans-serif;";
const INK = '#111827';
const MUTED = '#5b6670';
const BODY = '#374151';
const LINE = '#e1e7e7';
const FAINT = '#eef2f2';

const esc = (s) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function row(label, value, last) {
  const border = last ? '' : `border-bottom:1px solid ${FAINT};`;
  return `<tr><td style="${FONT}padding:9px 0;${border}font-size:14px;color:${MUTED}">${esc(label)}</td><td align="right" style="${FONT}padding:9px 0;${border}font-size:14px;color:${INK};font-weight:600">${esc(value)}</td></tr>`;
}

function cardHead(title) {
  return `<tr><td style="${FONT}padding:10px 16px;background:#f7f9f9;border-bottom:1px solid ${FAINT};font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:${MUTED};font-weight:700">${esc(title)}</td></tr>`;
}

function card(inner) {
  return `<tr><td style="padding:0 24px 16px" class="pad"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid ${LINE};border-radius:12px">${inner}</table></td></tr>`;
}

export function renderInsuranceReminderTemplate({
  brand,
  firstName,
  plan,
  region,
  coverStart,
  coverEnd,
  travellers,
  amount,
  paymentUrl,
  expiresOn,
  supportEmail,
  footerNote,
}) {
  const primary = brand.theme?.linkColor || brand.theme?.primaryColor || '#0d6a66';
  const tint = '#f2fafa';
  const tintLine = '#b8e0e2';

  const button = `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:18px auto 0"><tr><td style="border-radius:10px;background:${primary}"><a href="${esc(paymentUrl)}" style="${FONT}display:inline-block;padding:13px 26px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none">Pay and get covered</a></td></tr></table>`;

  const reassurance = `<tr><td style="padding:0 24px 16px" class="pad"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${tint};border:1px solid ${tintLine};border-radius:12px"><tr>
    <td width="44" valign="middle" style="padding:12px 0 12px 16px"><table role="presentation" cellspacing="0" cellpadding="0"><tr><td style="width:32px;height:32px;border-radius:16px;background:${primary};text-align:center;vertical-align:middle;${FONT}color:#ffffff;font-size:16px;font-weight:800">&#10003;</td></tr></table></td>
    <td style="padding:12px 16px 12px 12px;${FONT}"><b style="display:block;font-size:14.5px;font-weight:700;color:${INK}">Visa refused? You get your money back.</b><span style="font-size:13.5px;color:${BODY}">Send us the refusal letter before cover starts and we refund the ${esc(amount)} in full.</span></td>
  </tr></table></td></tr>`;

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<link href="https://fonts.googleapis.com/css2?family=Commissioner:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>@media (max-width:480px){.pad{padding-left:14px!important;padding-right:14px!important}}</style>
</head><body style="margin:0;background:#ffffff">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ffffff">
<tr><td style="padding:16px 24px;border-bottom:1px solid #e9eeee" class="pad"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
  <td style="${FONT}font-size:22px;font-weight:800;letter-spacing:-.02em;color:${INK}">${esc(brand.name)}</td>
  <td align="right" style="${FONT}font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:${MUTED};font-weight:600">Quote reminder</td>
</tr></table></td></tr>
<tr><td align="center" style="padding:28px 24px 22px" class="pad">
  <h1 style="${FONT}font-size:26px;font-weight:800;letter-spacing:-.015em;margin:0 0 8px;color:${INK}">You're one step away${firstName ? `, ${esc(firstName)}` : ''}.</h1>
  <p style="${FONT}margin:0;font-size:15px;color:#4b5563;line-height:1.5">Your travel insurance is quoted and ready. It just needs paying, and your certificate lands in your inbox straight after.</p>
  ${button}
  ${expiresOn ? `<p style="${FONT}margin:12px 0 0;font-size:13px;color:${MUTED}">This quote is held until ${esc(expiresOn)}. After that the price may change.</p>` : ''}
</td></tr>
${card(cardHead('Your quote') + `<tr><td style="padding:4px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0">${row('Plan', [plan, region].filter(Boolean).join(', '))}${row('Cover', `${coverStart} to ${coverEnd}`)}${row('Travellers', travellers)}${row('Total', amount, true)}</table></td></tr>`)}
${reassurance}
<tr><td style="padding:18px 24px 24px;background:#f7f9f9;border-top:1px solid #e9eeee;${FONT}font-size:13px;color:#4b5563" class="pad">
  <p style="margin:0 0 6px">Changed your mind, or need a different plan? Reply to this email or write to <a href="mailto:${esc(supportEmail)}" style="color:${primary}">${esc(supportEmail)}</a> and we will sort it out.</p>
  ${footerNote ? `<p style="margin:0;font-size:11.5px;color:#7a8787">${esc(footerNote)}</p>` : ''}
</td></tr>
</table></body></html>`;
}

export function renderInsuranceReminderText({
  brand,
  firstName,
  plan,
  region,
  coverStart,
  coverEnd,
  amount,
  paymentUrl,
  expiresOn,
  supportEmail,
}) {
  return [
    `You're one step away${firstName ? `, ${firstName}` : ''}.`,
    `Your ${brand.name} travel insurance is quoted and ready, it just needs paying.`,
    `${[plan, region].filter(Boolean).join(', ')}, cover ${coverStart} to ${coverEnd}, total ${amount}.`,
    `Pay here: ${paymentUrl}`,
    expiresOn ? `This quote is held until ${expiresOn}.` : '',
    `Visa refused? Send us the refusal letter before cover starts and we refund the ${amount} in full.`,
    supportEmail ? `Questions: ${supportEmail}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}
