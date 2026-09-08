// Usage: node --env-file=.env.production scripts/seo-blog-refresh.mjs [--apply]
//
// Content refresh for the three posts that decayed over the last quarter:
//   how-do-dummy-tickets-work            134 -> 56 clicks,  position 5.86 -> 7.97
//   are-dummy-tickets-legal...           150 -> 81 clicks,  position 4.58 -> 12.86
//   how-long-should-a-dummy-ticket...    162 -> 108 clicks, position 4.37 -> 5.36
//
// Two problems. They are thin (745 to 1,024 words against a ~1,650 word house
// benchmark), and all three opened with their own "What is a Dummy Ticket?"
// definition, competing for the same cluster that collapsed ("dummy ticket
// meaning" fell 5.96 to 12.02, "what is a dummy ticket" 7.89 to 10.71).
//
// So: how-do-dummy-tickets-work keeps and deepens the definition, the other two
// hand it off with a link and spend their words on the intent they actually own.
// Each post gains a comparison table, which is the format AI answers lift.
//
// updatedAt IS bumped here, unlike the earlier href and heading migrations.
// This is a real revision, so the freshness signal is honest.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes('--apply');

const P = (t) => `<p class="font-claude-response-body break-words whitespace-normal leading-[1.7]">${t}</p>\r\n`;
const H2 = (t) => `<h2 class="text-text-100 mt-3 -mb-1 text-[1.125rem] font-bold">${t}</h2>\r\n`;
const H3 = (t) => `<h3 class="text-text-100 mt-2 -mb-1 text-base font-bold">${t}</h3>\r\n`;
const UL = (items) =>
  `<ul class="[li_&amp;]:mb-0 [li_&amp;]:mt-1 [li_&amp;]:gap-1 [&amp;:not(:last-child)_ul]:pb-1 [&amp;:not(:last-child)_ol]:pb-1 list-disc flex flex-col gap-1 pl-8 mb-3">\r\n` +
  items.map((i) => `<li class="whitespace-normal break-words pl-2">${i}</li>\r\n`).join('') +
  `</ul>\r\n`;
const TH = (t) => `<th scope="col" class="text-text-100 border-b-0.5 border-border-300/60 py-2 pr-4 align-top font-bold">${t}</th>`;
const TD = (t) => `<td class="border-b-0.5 border-border-300/30 py-2 pr-4 align-top">${t}</td>`;
const TABLE = (head, rows) =>
  `<table class="min-w-full border-collapse text-sm leading-[1.7] whitespace-normal">\r\n<thead class="text-left">\r\n<tr>${head.map(TH).join('')}</tr>\r\n</thead>\r\n<tbody>\r\n` +
  rows.map((r) => `<tr>${r.map(TD).join('')}</tr>\r\n`).join('') +
  `</tbody>\r\n</table>\r\n`;
const A = (href, text) => `<a href="${href}">${text}</a>`;

const GDS = 'global distribution systems (Amadeus, Sabre, Travelport)';

// ---------------------------------------------------------------- post A
const A_NOT =
  H3('What a Dummy Ticket Is Not') +
  P(`A dummy ticket is not a picture of a ticket, and it is not something a free "generator" produces. Those tools output a PDF that looks like a booking but has no record behind it. Nothing is held in an airline system, so the reference fails the moment anyone checks it. A real dummy ticket is an actual reservation sitting in a booking system that has simply not been paid for.`) +
  P(`It is also not a ticket you can travel on. The seat is held, not bought, so it will not get you through a boarding gate. If you need to fly, you buy a ticket.`);

const A_COMPARE =
  H2('Dummy Ticket vs Real Ticket vs Refundable Ticket') +
  P('People usually weigh up three options when an embassy or an airline asks for proof of travel. They cost very different amounts and they do different jobs.') +
  TABLE(
    ['Option', 'What you pay', 'Verifiable PNR', 'Can you fly on it', 'Best for'],
    [
      ['Dummy ticket', 'From AED 49', 'Yes', 'No', 'Visa files, check-in proof, immigration checks'],
      ['Refundable ticket', 'Full fare upfront, refunded later', 'Yes', 'Yes', 'Travellers who will definitely fly and can float the cash'],
      ['Airline hold', 'Usually free', 'Yes, briefly', 'No', 'Very short windows, often 24 to 72 hours'],
      ['Free "generator" PDF', 'Nothing', 'No', 'No', 'Nothing. It fails verification'],
    ],
  ) +
  P(`The refundable ticket is the option people regret. You pay full fare, wait weeks for the refund, and if the visa is refused you are chasing an airline for your own money. A ${A('/', 'dummy ticket')} costs a fraction of that and carries the same verifiable reference.`);

const A_VERIFY =
  H2('How Does Verification Actually Work?') +
  P(`This is where most guides get it wrong, so it is worth being precise. Your reservation lives in the ${GDS} that embassies, airlines and travel agents all query. That is the check that always works, and it is the one consular staff run.`) +
  P(`Some airlines also display unpaid reservations on their own website. Emirates and Etihad both do, so with an ${A('/emirates-dummy-ticket', 'Emirates dummy ticket')} you can pull the booking up under Manage Booking yourself. Plenty of other carriers do not show unticketed bookings publicly, and that is normal rather than a sign of a problem. If your reservation does not appear on an airline's own site, the GDS record is still there.`) +
  H3('What an Officer Sees') +
  UL([
    'Your full name, matched against your passport',
    'Flight numbers, route, dates and times',
    'The booking status, confirmed or otherwise',
    'Whether a ticket has been issued against the reservation',
  ]) +
  P('That last line is the one people worry about. It shows the booking is unticketed, which is exactly what a reservation is. Embassies ask for evidence of your travel plan, not proof that you have already spent the money.');

// ---------------------------------------------------------------- post B
const B_DEF_NEW =
  H2('Is a Dummy Ticket the Same as a Fake Ticket?') +
  P(`No, and the distinction is the whole answer to the legality question. A dummy ticket is a real reservation held in an airline's system with a genuine PNR that has not been paid for. A fake ticket is a document someone made up. One is a booking. The other is a forgery.`) +
  P(`If you want the mechanics of how the reservation is created and checked, ${A('/blog/how-do-dummy-tickets-work', 'how dummy tickets work')} covers it in full. This post is about where the legal line sits.`);

const B_LAW =
  H2('What Does the Law Actually Require?') +
  P('No country has a law against holding an unpaid flight reservation. What the rules describe is the evidence you have to supply, and a reservation satisfies it.') +
  H3('Schengen') +
  P(`Article 14 of the ${A('https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32009R0810', 'EU Visa Code')} lists the supporting documents an applicant must provide. It asks for evidence of transport, or of the intended journey. It does not say the transport must be paid for. That is why a ${A('/dummy-ticket-schengen-visa', 'dummy ticket for a Schengen visa')} is accepted across VFS, BLS and the consulates.`) +
  H3('United Kingdom, United States and Canada') +
  P('These three assess your travel plan and your intent to return rather than demanding a purchased ticket. UKVI guidance is explicit that you should not buy travel before a decision. US consular officers look at your overall circumstances at interview. Canada asks for a travel itinerary. In all three, a reservation is the sensible thing to submit.') +
  H3('Airlines and Immigration') +
  P(`Separate from visas, carriers check that you can leave a country before they let you board, because they carry the cost if you are refused entry. That is the ${A('/onward-ticket', 'onward ticket')} requirement, and a reservation with a live PNR satisfies it at the desk.`);

const B_FRAUD =
  H2('When Does a Dummy Ticket Become Fraud?') +
  P('The reservation is not the risk. What you do around it is. These are the things that turn an accepted document into a refusal, or worse.') +
  TABLE(
    ['What you submit', 'Status', 'What happens'],
    [
      ['A genuine unpaid reservation with a live PNR', 'Accepted', 'Verifies normally, no issue'],
      ['A PDF from a free generator, no record behind it', 'Document fraud', 'Fails verification, application refused'],
      ['A real PNR that expired before the file was opened', 'Treated as no evidence', 'Refusal or a request for new documents'],
      ['A reservation with a name that does not match the passport', 'Treated as an inconsistency', 'Refusal, and questions about the rest of the file'],
      ['Editing a real booking to change dates or route', 'Document fraud', 'Refusal, and possible entry ban'],
    ],
  ) +
  P('Notice that four of those five have nothing to do with whether the ticket was paid for. They are about whether the document is genuine and whether it still holds when someone looks. Get a real reservation, keep the details matching your passport, and make sure it is live on the day of your appointment.');

// ---------------------------------------------------------------- post C
const C_DEF_NEW =
  H2('What Does Validity Actually Mean Here?') +
  P(`Validity is the window during which your reservation stays live in the airline system and returns a result when someone checks it. Before it expires, an officer running your PNR through the ${GDS} sees a confirmed booking. After it expires, they see nothing, and an expired reservation is treated the same as no reservation at all.`) +
  P(`If you want the underlying mechanics, ${A('/blog/how-do-dummy-tickets-work', 'how dummy tickets work')} explains how the booking is created and checked. This post is about choosing the right window.`);

const C_CHOOSE =
  H2('Which Validity Period Should You Choose?') +
  P('Match the window to how long your document will sit in someone else\'s queue, then add a buffer. Guessing short is the most common and most expensive mistake.') +
  TABLE(
    ['Validity', 'Price', 'Use it when'],
    [
      ['2 days', 'AED 49', 'Your appointment is within 48 hours, or you need proof at check-in or the border today'],
      ['7 days', 'AED 69', 'Standard visa appointment, documents reviewed the same week'],
      ['14 days', 'AED 79', 'Longer processing, a multi-stage application, or an appointment date that could move'],
    ],
  ) +
  P(`The price follows the window you pick, not availability, and every tier carries the same verifiable PNR. If your appointment is more than two weeks out, do not buy early. Book the reservation a day or two before you submit.`);

const C_TIMING =
  H2('How Long Do Consulates Take to Look at It?') +
  P('Your validity only has to cover the period from submission to the point an officer opens the file, which is usually early in the process rather than at the end.') +
  UL([
    'Schengen: the file is typically opened within a few working days of submission, though a decision can take much longer',
    'UK: documents are checked at the appointment and again during processing',
    'Immigration and airline check-in: the check happens on the spot, so a short window is fine',
  ]) +
  P(`For Schengen specifically, ${A('/blog/how-long-does-a-schengen-visa-take-from-the-uae', 'how long a Schengen visa takes from the UAE')} breaks the timeline down. The practical rule is that 7 days covers most appointments and 14 days covers the ones where the date might move.`);


const B_PROVIDER =
  H2('How Do You Tell a Legitimate Provider From a Risky One?') +
  P('Since the reservation itself is legal, the risk sits almost entirely with who you buy it from. A provider that issues a genuine booking gives you a document that verifies. A provider that generates a PDF gives you a refusal. They often look identical on the website, so check for these.') +
  UL([
    'A six-character PNR you can check yourself, not just an attached PDF',
    'A stated validity period, so you know when the booking expires',
    'A named company with a real address, rather than an anonymous checkout',
    'A price that reflects a service. Free almost always means generated, not booked',
    'Support you can reach before your appointment, not just an autoresponder',
  ]) +
  P(`If a provider cannot tell you which system the booking sits in, or the reference does not return anything when checked, that is the answer. Our reservations are issued through official airline systems and carry a live PNR, from AED 49.`);

const C_RESCHEDULE =
  H2('What If Your Appointment Moves?') +
  P('Appointment dates slip, especially in peak season, and a reservation bought for the original date will not stretch to cover the new one. There is no way to extend a booking that has already expired, because the seat hold is released back to the airline.') +
  P('Two practical habits avoid it. Buy the reservation once your appointment is confirmed rather than when you start preparing, and if the date is more than a week out, take the 14 day window rather than the 7. The difference is AED 10, which is a great deal cheaper than resubmitting a file.') +
  H3('If It Expires Before Submission') +
  P('Book a new one. It is a fresh reservation with a new PNR, so update any document that quotes the old reference, and check that the dates still line up with the rest of your application. Nothing carries over from the expired booking.');

// ---------------------------------------------------------------- plan
const EDITS = {
  'how-do-dummy-tickets-work': [
    { before: H2('Types of Dummy Tickets'), insert: A_NOT },
    { before: H2('How Do I Book a Dummy Ticket?'), insert: A_COMPARE },
    { before: H2('Are Dummy Tickets Legal and Safe to Use?'), insert: A_VERIFY },
  ],
  'are-dummy-tickets-legal-for-visa-application': [
    { replaceSection: 'What is a Dummy Ticket?', with: B_DEF_NEW },
    { before: H2('Why Do Embassies Accept Dummy Tickets?'), insert: B_LAW },
    { before: H2('Best Practices When Using a Dummy Ticket'), insert: B_FRAUD },
    { before: H2('The Bottom Line'), insert: B_PROVIDER },
  ],
  'how-long-should-a-dummy-ticket-be-valid': [
    { replaceSection: 'What Is a Dummy Ticket?', with: C_DEF_NEW },
    { before: H2('What Affects Dummy Ticket Validity?'), insert: C_CHOOSE },
    { before: H2('Can You Extend a Dummy Ticket?'), insert: C_TIMING },
    { before: H2('The Bottom Line'), insert: C_RESCHEDULE },
  ],
};

await mongoose.connect(process.env.MONGO_URI);
const Blog = mongoose.connection.collection('blogs');
const slugs = Object.keys(EDITS);
const posts = await Blog.find({ slug: { $in: slugs } }).toArray();

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backup = join(__dirname, `seo-blog-refresh-backup-${stamp}.json`);
writeFileSync(backup, JSON.stringify(posts, null, 2));
console.log(`backed up ${posts.length} posts -> ${backup}\n`);

const words = (h) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;
let failures = 0;
const rows = [];

for (const slug of slugs) {
  const post = posts.find((p) => p.slug === slug);
  if (!post) { console.error(`MISSING ${slug}`); failures++; continue; }
  let c = post.content;
  const before = words(c);

  for (const step of EDITS[slug]) {
    if (step.replaceSection) {
      const re = new RegExp(`<h2[^>]*>${step.replaceSection.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</h2>[\\s\\S]*?(?=<h2)`);
      if (!re.test(c)) { console.error(`NO SECTION [${slug}] ${step.replaceSection}`); failures++; continue; }
      c = c.replace(re, step.with);
    } else {
      if (!c.includes(step.before)) { console.error(`NO ANCHOR [${slug}] ${step.before.slice(0, 70)}`); failures++; continue; }
      c = c.replace(step.before, step.insert + step.before);
    }
  }

  // Only one post should still define the term, so the cluster stops competing.
  const defines = /<h2[^>]*>What [Ii]s a Dummy Ticket\?<\/h2>/.test(c);
  if (slug === 'how-do-dummy-tickets-work' && !defines) { console.error(`${slug} should keep the definition H2`); failures++; }
  if (slug !== 'how-do-dummy-tickets-work' && defines) { console.error(`${slug} still owns a duplicate definition H2`); failures++; }

  post.content = c;
  rows.push({ post: slug, words: `${before} -> ${words(c)}`, tables: (c.match(/<table/g) || []).length });
}

if (failures) { console.error(`\n${failures} problem(s). Nothing written.`); await mongoose.disconnect(); process.exit(1); }
console.table(rows);

if (!APPLY) { console.log('\nDRY RUN. Re-run with --apply to write.'); await mongoose.disconnect(); process.exit(0); }
const now = new Date();
for (const slug of slugs) {
  const post = posts.find((p) => p.slug === slug);
  await Blog.updateOne({ slug }, { $set: { content: post.content, updatedAt: now } });
}
console.log(`\napplied to ${slugs.length} posts, updatedAt bumped to ${now.toISOString()}`);
await mongoose.disconnect();
