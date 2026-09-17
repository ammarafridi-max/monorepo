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

function cardHead(title, extra = '') {
  return `<tr><td style="${FONT}padding:10px 16px;background:#f7f9f9;border-bottom:1px solid ${FAINT};font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:${MUTED};font-weight:700">${esc(title)}${extra}</td></tr>`;
}

function card(inner) {
  return `<tr><td style="padding:0 24px 16px" class="pad"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid ${LINE};border-radius:12px">${inner}</table></td></tr>`;
}

function documentRow(doc, primary, last) {
  const border = last ? '' : `border-bottom:1px solid ${FAINT}`;
  return `<tr><td style="padding:9px 16px;${border}"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
    <td style="${FONT}font-size:14px;font-weight:600;color:${INK}">${esc(doc.name)}</td>
    <td width="36" align="right"><a href="${esc(doc.url)}" style="${FONT}display:inline-block;width:36px;height:36px;border-radius:18px;background:${primary};color:#ffffff;text-align:center;line-height:36px;font-size:18px;font-weight:700;text-decoration:none">&#8595;</a></td>
  </tr></table></td></tr>`;
}

function upsellCard(u, primary) {
  const icon = u.iconUrl
    ? `<td width="30" valign="top"><img src="${esc(u.iconUrl)}" width="22" height="22" alt="" style="border-radius:11px;display:block;margin-top:2px"></td>`
    : '';
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid ${LINE};border-radius:12px"><tr><td style="padding:14px">
  <table role="presentation" cellspacing="0" cellpadding="0"><tr>${icon}<td style="${FONT}font-size:14px;font-weight:600;color:${INK};line-height:1.25">${esc(u.title)}${u.brand ? `<br><span style="font-weight:400;font-size:12px;color:${MUTED}">${esc(u.brand)}</span>` : ''}</td></tr></table>
  <p style="${FONT}margin:8px 0 12px;font-size:13.5px;color:#4b5563;line-height:1.45">${esc(u.description)}</p>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
    <td style="${FONT}font-size:13px;color:${MUTED}">${u.price ? `from <b style="color:${INK}">${esc(u.price)}</b>` : ''}</td>
    <td align="right"><a href="${esc(u.href)}" style="${FONT}display:inline-block;font-size:12.5px;font-weight:600;color:#ffffff;background:${primary};text-decoration:none;border-radius:8px;padding:7px 12px">${esc(u.ctaLabel || 'Book now')}</a></td>
  </tr></table>
</td></tr></table>`;
}

/**
 * Customer-facing policy confirmation. Brand-neutral: names, colours, links
 * and any cross-sell come from the caller.
 */
export function renderPolicyIssuedTemplate({
  brand,
  firstName,
  policyNumber,
  plan,
  region,
  coverStart,
  coverEnd,
  travellers,
  amount,
  documents = [],
  attachedCount = 0,
  refundBeforeStart,
  claimsUrl,
  supportEmail,
  upsells = [],
  footerNote,
}) {
  const primary = brand.theme?.linkColor || brand.theme?.primaryColor || '#0d6a66';
  const tint = '#f2fafa';
  const tintLine = '#b8e0e2';

  const docsCard = documents.length
    ? card(
        cardHead(
          'Your documents',
          attachedCount
            ? `<span style="float:right;font-weight:500;letter-spacing:0;text-transform:none;font-size:12px;color:${primary}">Also attached as PDF</span>`
            : '',
        ) + documents.map((d, i) => documentRow(d, primary, i === documents.length - 1)).join(''),
      )
    : card(
        cardHead('Your documents') +
          `<tr><td style="${FONT}padding:12px 16px;font-size:14px;color:${BODY}">Your certificate and policy wording are being prepared and will be on your confirmation page within a few minutes.</td></tr>`,
      );

  const refundCard = refundBeforeStart
    ? `<tr><td style="padding:0 24px 16px" class="pad"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${tint};border:1px solid ${tintLine};border-radius:12px"><tr>
    <td width="44" valign="middle" style="padding:12px 0 12px 16px"><table role="presentation" cellspacing="0" cellpadding="0"><tr><td style="width:32px;height:32px;border-radius:16px;background:${primary};text-align:center;vertical-align:middle;${FONT}color:#ffffff;font-size:16px;font-weight:800">&#10003;</td></tr></table></td>
    <td style="padding:12px 16px 12px 12px;${FONT}"><b style="display:block;font-size:14.5px;font-weight:700;color:${INK}">Visa refused before ${esc(coverStart)}? Full refund.</b><span style="font-size:13.5px;color:${BODY}">Reply with the refusal letter and we return the ${esc(amount)}.</span></td>
  </tr></table></td></tr>`
    : '';

  const upsellCards = upsells.length
    ? card(
        cardHead('You might also need') +
          `<tr><td style="padding:14px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>${upsells
            .slice(0, 2)
            .map(
              (u, i) =>
                `<td class="col" width="${Math.floor(100 / Math.min(upsells.length, 2))}%" valign="top" style="padding-${i === 0 ? 'right' : 'left'}:6px">${upsellCard(u, primary)}</td>`,
            )
            .join('')}</tr></table></td></tr>`,
      )
    : '';

  const tips = [
    'Save the certificate to your phone.',
    'Call the 24/7 line on page 1 of the certificate before any hospital admission.',
    `Keep every receipt.${claimsUrl ? ` <a href="${esc(claimsUrl)}" style="color:${primary}">How to claim</a>` : ''}`,
  ];

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<link href="https://fonts.googleapis.com/css2?family=Commissioner:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>@media (max-width:480px){.col{display:block!important;width:100%!important;padding:0 0 12px 0!important}.pad{padding-left:14px!important;padding-right:14px!important}}</style>
</head><body style="margin:0;background:#ffffff">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ffffff">
<tr><td style="padding:16px 24px;border-bottom:1px solid #e9eeee" class="pad"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
  <td style="${FONT}font-size:22px;font-weight:800;letter-spacing:-.02em;color:${INK}">${esc(brand.name)}</td>
  <td align="right" style="${FONT}font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:${MUTED};font-weight:600">Policy confirmation</td>
</tr></table></td></tr>
<tr><td align="center" style="padding:28px 24px 22px" class="pad">
  <table role="presentation" cellspacing="0" cellpadding="0"><tr><td style="width:48px;height:48px;border-radius:24px;background:#dbeff1;text-align:center;vertical-align:middle;${FONT}font-size:24px;color:${primary};font-weight:800">&#10003;</td></tr></table>
  <h1 style="${FONT}font-size:26px;font-weight:800;letter-spacing:-.015em;margin:14px 0 6px;color:${INK}">You're covered${firstName ? `, ${esc(firstName)}` : ''}.</h1>
  <p style="${FONT}margin:0;font-size:15px;color:#4b5563">Your policy is issued. Documents are ${attachedCount ? 'attached and ' : ''}linked below.</p>
  <table role="presentation" cellspacing="0" cellpadding="0" style="margin-top:16px"><tr><td style="${FONT}padding:9px 16px;border:1px solid ${tintLine};background:${tint};border-radius:999px;font-size:13px"><span style="color:${MUTED};text-transform:uppercase;letter-spacing:.08em;font-size:10.5px;font-weight:600">Policy no.</span>&nbsp;&nbsp;<b style="letter-spacing:.02em">${esc(policyNumber)}</b></td></tr></table>
</td></tr>
${card(cardHead('Your cover') + `<tr><td style="padding:4px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0">${row('Plan', [plan, region].filter(Boolean).join(', '))}${row('Cover', `${coverStart} to ${coverEnd}`)}${row('Travellers', travellers)}${row('Paid', amount, true)}</table></td></tr>`)}
${refundCard}
${docsCard}
${upsellCards}
${card(cardHead('Before you travel') + `<tr><td style="padding:4px 16px"><ul style="${FONT}margin:0;padding:0 0 0 18px;font-size:14px;color:${BODY};line-height:1.5">${tips.map((t, i) => `<li style="padding:7px 0;${i < tips.length - 1 ? `border-bottom:1px solid ${FAINT}` : ''}">${t}</li>`).join('')}</ul></td></tr>`)}
<tr><td style="padding:18px 24px 24px;background:#f7f9f9;border-top:1px solid #e9eeee;${FONT}font-size:13px;color:#4b5563" class="pad">
  <p style="margin:0 0 6px">Questions? Reply to this email or write to <a href="mailto:${esc(supportEmail)}" style="color:${primary}">${esc(supportEmail)}</a>.</p>
  ${footerNote ? `<p style="margin:0;font-size:11.5px;color:#7a8787">${esc(footerNote)}</p>` : ''}
</td></tr>
</table></body></html>`;
}

export function renderPolicyIssuedText({ brand, policyNumber, coverStart, coverEnd, amount, refundBeforeStart, documents = [] }) {
  const lines = [
    `Your ${brand.name} policy ${policyNumber} is issued. Cover ${coverStart} to ${coverEnd}. Paid ${amount}.`,
    refundBeforeStart ? `Visa refused before ${coverStart}? Reply with the refusal letter for a full refund of ${amount}.` : '',
    ...documents.map((d) => `${d.name}: ${d.url}`),
  ];
  return lines.filter(Boolean).join('\n');
}
