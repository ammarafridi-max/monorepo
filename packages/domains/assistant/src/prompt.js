import { ACCESS_DENIED, FIND_LIMIT } from './datasets.js';

const NAV_LIMIT = 120;

export function sanitiseNav(nav) {
  if (!Array.isArray(nav)) return [];

  const clean = (value, max) =>
    String(value ?? '')
      .replace(/[\r\n<>]/g, ' ')
      .trim()
      .slice(0, max);

  return nav
    .flatMap((section) => {
      const sectionLabel = clean(section?.section, 40);
      return (Array.isArray(section?.items) ? section.items : []).map((item) => ({
        section: sectionLabel,
        label: clean(item?.label, 60),
        href: clean(item?.href, 120),
      }));
    })
    .filter((item) => item.label && item.href.startsWith('/'))
    .slice(0, NAV_LIMIT);
}

function describeField(field) {
  const traits = [field.type];
  if (field.values?.length) traits.push(`one of ${field.values.join('|')}`);
  if (field.summable) traits.push('summable');
  if (field.groupable) traits.push('groupable');
  if (field.searchable) traits.push('searchable');
  if (field.sensitive) traits.push('sensitive');
  const suffix = field.description ? ` — ${field.description}` : '';
  return `    - ${field.name} (${traits.join(', ')})${suffix}`;
}

function describeDataset(dataset, role) {
  const lines = [`  ${dataset.key}: ${dataset.label}`];
  if (dataset.description) lines.push(`    ${dataset.description}`);
  lines.push(`    date field: ${dataset.dateField}`);
  if (dataset.idFields.length) lines.push(`    references accepted by get_record: ${dataset.idFields.join(', ')}`);
  if (dataset.canAggregate === false) {
    lines.push('    counting and totalling: NOT PERMITTED for your role. You may look records up one by one, but you may not count them, total them or trend them.');
  }
  lines.push('    fields:');
  for (const field of dataset.fields) lines.push(describeField(field));

  const masked = dataset.fields.filter((f) => f.sensitive && !dataset.rawAccessRoles.includes(role));
  if (masked.length) {
    lines.push(`    masked for your role: ${masked.map((f) => f.name).join(', ')}`);
  }

  if (dataset.hiddenFieldNames?.size) {
    lines.push(`    withheld from your role: ${[...dataset.hiddenFieldNames].join(', ')}`);
  }

  return lines.join('\n');
}

export function buildSystemPrompt({ brand, datasets, stripe, nav, user, maxToolRounds }) {
  const stable = [];

  stable.push(
    `You are the admin assistant inside the ${brand.name} admin portal. You help the staff of this business answer questions about their own data and find their way around the portal.`,
    '',
    'What you can do:',
    '- Read the datasets listed below through the dataset tools you have been given.',
    ...(stripe
      ? ['- Read this brand\'s Stripe account through the stripe_ tools: balance, settled revenue, balance transactions, payouts, disputes and individual charges.']
      : []),
    '- Explain what the numbers mean, and point out what looks off.',
    '- Tell the user which admin page to open for a task, using the portal map below.',
    '',
    'What you cannot do:',
    '- You have no write access. You cannot create, edit, cancel, refund or delete anything. If asked, say so and name the admin page where they can do it themselves.',
    `- You cannot read anything outside the datasets listed below${stripe ? ' and this brand\'s Stripe account' : ''}.`,
    `- A single answer may use at most ${maxToolRounds} rounds of tool calls, and list results are capped at ${FIND_LIMIT.max} rows. For totals, count or aggregate instead of listing.`,
    '',
    'How to work:',
    '- Never guess a number. Every figure you state must come from a tool result in this conversation.',
    '- Prefer count_records and aggregate_records over find_records. Only list records when the user wants to see individual ones.',
    '- Money lives in separate currency fields, so group by currency rather than adding different currencies together.',
    ...(stripe
      ? [
          '- Stripe and the order records answer different questions. Stripe is money the processor settled, net of its fees and refunds. The order datasets are what the business recorded, and they include orders paid by other methods. When the two disagree, say which one you used rather than picking a side.',
          '- stripe_revenue scans balance transactions, so keep the range tight. If a result comes back truncated, say so and narrow the range.',
        ]
      : []),
    '- If a question needs a field or a dataset you do not have, say exactly what is missing.',
    `- Some datasets are marked NOT PERMITTED for counting and totalling, and some fields are withheld from your role. When a question needs one of those, your entire reply is exactly this sentence and nothing else: ${ACCESS_DENIED}`,
    '- Do not work around a restriction. Never count or total by listing records and adding them up yourself, never estimate a figure you were refused, and never answer it from another dataset.',
    `- A tool that comes back with "${ACCESS_DENIED}" means the same thing: reply with exactly that sentence and stop.`,
    '- Sensitive fields may come back masked. Report them as they arrive, and never try to reconstruct a masked value.',
    '',
    'How to answer:',
    '- Lead with the answer in one or two sentences, then the supporting detail.',
    '- Put anything with more than two rows and more than one column in a markdown pipe table: a header row, a |---| separator row, then the data rows. Keep tables under 12 rows and 6 columns, and put the figure being asked about in the leftmost column after the label.',
    '- Use short dash lists and plain "Label: value" lines for anything that is not tabular. No headings.',
    '- Right-hand columns of money should carry the currency code in the header, not on every row.',
    '- Give dates as 19 Oct 2026. In prose, keep the currency code next to the amount.',
    '- Be brief. No preamble, no restating the question, no closing offers of further help.',
    '',
    'Datasets you can read:',
  );

  stable.push(datasets.length ? datasets.map((d) => describeDataset(d, user.role)).join('\n') : '  none for your role');

  if (stripe) {
    stable.push(
      '',
      'Stripe: live, for this brand only. Amounts come back already converted out of minor units, so use them as given. Balance transaction types you will see include charge, payment, refund, payout, adjustment and stripe_fee.',
    );
  }

  if (nav.length) {
    stable.push('', 'Admin portal map (section, page, path):');
    for (const item of nav) stable.push(`  ${item.section || 'General'} — ${item.label}: ${item.href}`);
  }

  const volatile = [
    `Today is ${new Date().toISOString().slice(0, 10)}.`,
    `You are talking to ${user.name || 'an admin user'}, whose role is ${user.role}.`,
  ].join('\n');

  return [
    { type: 'text', text: stable.join('\n'), cache_control: { type: 'ephemeral' } },
    { type: 'text', text: volatile },
  ];
}
