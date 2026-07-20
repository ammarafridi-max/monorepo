/**
 * Copy for the content pages (privacy, terms, refunds, contact), kept out of JSX
 * so the wording is editable without touching layout. Everything here is written
 * to match how Picturesk ACTUALLY works, not generic template text:
 *
 *  - Real processors: Stripe (payment), Cloudflare R2 (storage), Replicate (model
 *    training + image generation), Brevo (email).
 *  - The refund is the FAILED-order auto-refund only, not a satisfaction guarantee.
 *  - We do not claim photo auto-deletion or a retention schedule the system does not
 *    enforce; see the TODO markers where a human needs to confirm policy.
 *
 * Each doc is { updated, lede, sections: [{ h, body: string[], list?: string[],
 * link?: { text, href } }] }, rendered by app/Sections.js.
 */

export const LAST_UPDATED = 'July 9, 2026';

// Placeholder support address, mirrored from the footer. Swap for the real inbox.
// TODO: swap for the real support address before launch.
export const CONTACT_EMAIL = 'hello@picturesk.ai';
export const RESPONSE_TIME = 'within two business days';

export const privacy = {
  updated: LAST_UPDATED,
  lede: 'This explains what Picturesk collects, why, and who we work with. In plain terms: we use your photos only to make your headshots, with a small set of named providers.',
  sections: [
    {
      h: 'What we collect',
      body: [
        'The photos you upload. Five to fifteen selfies of one person, used to build a model of your face.',
        'Your email address. We use it to send your finished headshots, and to run an optional account if you create one.',
        'Payment information. Your card is entered and processed by Stripe. We never see or store your full card details. We keep an order record and the Stripe reference for it.',
        'Basic order data. The status and timestamps of your order, so we can run and support it.',
      ],
    },
    {
      h: 'How we use it',
      body: [
        'We use your photos for one purpose: to fine-tune a model on your face and generate your headshots. We do not use them to train any shared or general model, and we do not sell them.',
        'We use your email to deliver your results and send messages about your order. If you create an account, we use it to show you your past orders.',
      ],
    },
    {
      h: 'Who we share it with',
      body: ['We run Picturesk on a small set of processors, each doing one job:'],
      list: [
        'Stripe, for payment. Your card details go directly to Stripe.',
        'Cloudflare R2, for storage. Your uploaded photos and generated headshots are stored here.',
        'Replicate, for model training and image generation. Your photos are sent to Replicate to train your model and produce your headshots.',
        'Brevo, for email. We use it to send your results link.',
      ],
    },
    {
      h: 'Selling your data',
      body: [
        'We do not sell your data to anyone. Each processor above receives only what it needs to do its job, and only to run your order.',
      ],
    },
    {
      h: 'Analytics',
      body: [
        'We use privacy-light, cookieless analytics (Plausible) to measure how the site is used, for example how many people reach the upload step or complete an order. It sets no cookies, builds no cross-site profile, and collects no personal data. We never send your email, your photos, or your order contents to it. It counts steps in aggregate only, and it is disabled entirely unless configured.',
      ],
    },
    {
      h: 'Where your data is stored',
      body: [
        'Uploaded photos and generated images are stored with Cloudflare R2. Model training and image generation run on Replicate. Payment data is held by Stripe.',
        // TODO: confirm data storage region(s) with each provider and state them here.
        'We keep your data for as long as we need it to provide and support your order. We do not currently run automatic deletion, so your photos and results stay in storage until they are removed. If you want them removed sooner, contact us and we will delete them.',
        // TODO: confirm retention policy (whether/when uploads and results are auto-deleted).
      ],
    },
    {
      h: 'Your rights',
      body: [
        'You can ask what we hold about you, and you can ask us to delete your photos, your results, or your account. Send the request from the email you used, through our contact page, and we will action it.',
      ],
      link: { text: 'Contact us', href: '/contact' },
    },
    {
      h: 'Children',
      body: [
        'Picturesk is for adults. You must be at least 18 to use it. It is not directed at children, and we do not knowingly collect data from anyone under 18.',
      ],
    },
    {
      h: 'Changes to this policy',
      body: [
        'If we change how we handle your data, we will update this page and the date at the top. Continued use after a change means you accept the updated policy.',
      ],
    },
  ],
};

export const terms = {
  updated: LAST_UPDATED,
  lede: 'These terms cover using Picturesk. By uploading photos and paying, you agree to them.',
  sections: [
    {
      h: 'What Picturesk does',
      body: [
        'Picturesk turns your selfies into professional headshots. You upload five to fifteen photos of one person, we fine-tune a model on that face, generate a set of headshots, and email you a link to download them.',
        'Results are produced by an AI model and vary with the quality of your input photos. We provide a set of generated headshots, not a specific guaranteed look.',
      ],
    },
    {
      h: 'Eligibility',
      body: [
        'You must be at least 18 and able to enter a contract. By using Picturesk you confirm that you are.',
      ],
    },
    {
      h: 'Acceptable use',
      body: [
        'Upload only your own face, or the face of someone who has given you clear permission and the rights to use their photos. Do not upload photos of other people without their consent.',
        'Do not use Picturesk for anything illegal, deceptive, or abusive. That includes impersonation, harassment, and any content that infringes the rights of other people.',
        'One person per order. Each order trains on a single face.',
      ],
    },
    {
      h: 'Payment',
      body: [
        'Picturesk offers three one-time plans, starting at twenty-nine US dollars for one set of headshots. Each is a one-time charge, not a subscription.',
        'The price for each plan is set on our server and charged through Stripe Checkout. You pay before we train your model.',
      ],
    },
    {
      h: 'Refunds',
      body: [
        'If a run fails and we cannot deliver your headshots, you are refunded automatically. Dissatisfaction with a delivered set is handled case by case.',
      ],
      link: { text: 'Read the full Refund Policy', href: '/refunds' },
    },
    {
      h: 'Your images and rights',
      body: [
        'Your face is yours. We do not claim ownership of your likeness.',
        'The headshots we deliver are yours to use. You receive the rights to use your delivered images for personal and commercial purposes, such as LinkedIn, a resume, or a company page.',
        'To provide the service, you give us a limited license to process your uploaded photos: to store them, send them to the processors named in our Privacy Policy, train your model, and generate your results. This license exists only to run your order.',
      ],
      link: { text: 'See our Privacy Policy', href: '/privacy' },
    },
    {
      h: 'Disclaimers',
      body: [
        'Picturesk is provided as is. Because results are AI-generated and depend on your input photos, we do not warrant that any specific headshot will meet a particular expectation.',
      ],
    },
    {
      h: 'Limitation of liability',
      body: [
        'To the extent the law allows, our total liability for any claim connected to Picturesk is limited to the amount you paid for your order.',
      ],
    },
    {
      h: 'Governing law',
      body: [
        // TODO: confirm governing law / jurisdiction (UAE?) and state it explicitly here.
        'These terms are governed by the laws of the jurisdiction in which Picturesk operates. The specific jurisdiction will be confirmed here.',
      ],
    },
    {
      h: 'Changes to these terms',
      body: [
        'We may update these terms. When we do, we will update the date at the top of this page. Continued use after a change means you accept the updated terms.',
      ],
    },
  ],
};

export const refunds = {
  updated: LAST_UPDATED,
  lede: 'The short version: if a run fails, you get your money back automatically.',
  sections: [
    {
      h: 'Automatic refund when a run fails',
      body: [
        'If you pay and the system cannot deliver your headshots, your payment is refunded in full, automatically. You do not need to ask.',
        'This is built into how Picturesk works. When an order fails, it issues one full refund to your original Stripe payment, once.',
      ],
    },
    {
      h: 'When you will see it',
      body: [
        'The refund goes back to the card you paid with, through Stripe. Stripe usually returns it to your statement within a few business days.',
      ],
    },
    {
      h: 'What is not automatically refunded',
      body: [
        'If your headshots are delivered successfully but you are not happy with them, that is not covered by the automatic refund, because the run did not fail.',
        'We still want to help. If a delivered set missed the mark, contact us and we will work with you.',
      ],
      link: { text: 'Contact us', href: '/contact' },
    },
    {
      h: 'Getting the best result',
      body: [
        'Most poor results come from the input photos. We check your photos before you pay and flag any that will hurt the result, so you are not paying for input that cannot work.',
      ],
    },
  ],
};
