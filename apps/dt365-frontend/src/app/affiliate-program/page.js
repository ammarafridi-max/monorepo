import { getBrand } from '@travel-suite/config';
import { WHATSAPP_NUMBER } from '@/config/contact';
import PageHero from '@travel-suite/frontend-shared/components/sections/v1/PageHero';
import QuickAnswer from '@travel-suite/frontend-shared/components/sections/v1/QuickAnswer';
import Process from '@travel-suite/frontend-shared/components/sections/v1/Process';
import Benefits from '@travel-suite/frontend-shared/components/sections/v1/Benefits';
import TermsSummary from '@travel-suite/frontend-shared/components/sections/v1/TermsSummary';
import FAQ from '@travel-suite/frontend-shared/components/sections/v1/FAQ';
import Contact from '@travel-suite/frontend-shared/components/sections/v1/Contact';
import {
  HiOutlineBanknotes,
  HiOutlineLink,
  HiOutlineLockClosed,
} from 'react-icons/hi2';
import {
  SITE_URL,
  buildBreadcrumbList,
  buildFAQPage,
  buildGraph,
  buildMetadata,
  buildOrganization,
  buildWebPage,
  buildWebsite,
} from '@/lib/schema';

const brand = getBrand('dt365');
const EMAIL = brand.emails.support;
const BRAND_NAME = brand.name;

export const revalidate = 86400;

const meta = {
  title: `${BRAND_NAME} Affiliate Program | Earn On Every New Customer`,
  description: `Join the ${BRAND_NAME} affiliate program. Get a tracking link, a 30 day first touch cookie and commission on every new customer's first paid order, paid on the 5th of each month.`,
  canonical: `${SITE_URL}/affiliate-program`,
};

const breadcrumb = [
  { label: 'Home', path: '/' },
  { label: 'Affiliate Program', path: '/affiliate-program' },
];

const joinSteps = [
  {
    title: 'Email us about your audience',
    text: `Send a note to ${EMAIL} telling us where you would promote us, whether that is a travel blog, an agency client base, a newsletter or a social account. We read every application by hand, so it is not instant.`,
  },
  {
    title: 'Get your link and your rate',
    text: 'If we approve you, we set up your account and send you your nine digit affiliate ID, your tracking link and your commission rate in writing. Nothing about the rate is left vague.',
  },
  {
    title: 'Share the link and get paid',
    text: `Add ?affId= plus your ID to any page on ${brand.domain} and send readers to whichever page fits your content. We total up the month and pay on the 5th of the next one.`,
  },
];

const benefits = [
  {
    title: 'Your Link Works On Every Page',
    text: `Your tracking link is https://www.${brand.domain}/?affId= plus your nine digit ID. Drop that query on any page of the site, not just the homepage, so a Schengen article can point at the Schengen page and still credit you.`,
    icon: HiOutlineLink,
  },
  {
    title: 'Your Rate Is Frozen Onto Each Sale',
    text: 'Commission is a percentage of the order value, and your rate is written onto each sale at the moment the customer pays. If we change your rate later, the money you have already earned does not move.',
    icon: HiOutlineLockClosed,
  },
  {
    title: 'No Minimum, And The Fee Is Ours',
    text: 'One order is enough to get paid. There is no minimum payout and no holding period, you pick bank transfer or PayPal, and we cover the transfer fee so the amount that lands matches your statement.',
    icon: HiOutlineBanknotes,
  },
];

const terms = [
  {
    term: 'First paid purchase only',
    detail:
      'Commission is due on a customer’s first paid order. If that email address has already paid through any affiliate, there is no commission on that order or on anything they buy afterwards. This is a new customer program, not a recurring revenue share, so plan your promotion around reaching people who have not bought from us yet.',
  },
  {
    term: 'The 30 day window is hard',
    detail:
      'A click is stored in the visitor’s browser for 30 days, and attribution is checked again at the moment they pay. A purchase on day 31 earns nothing. Cookies are also per browser and per device, so a click on a phone and a purchase on a laptop will not connect.',
  },
  {
    term: 'First touch wins',
    detail:
      'If a visitor already carries unexpired attribution from another affiliate, your click does not overwrite it. The same rule protects you when you got there first, because a later affiliate cannot take the sale off you.',
  },
  {
    term: 'Refunds cancel commission',
    detail:
      'A refunded order earns nothing. If the refund happens before payout, the order drops off that month’s statement. If it lands after we have already paid you, we absorb the loss. We will not claw the commission back, deduct it from a later statement, or send you an invoice.',
  },
  {
    term: 'Paid monthly on the 5th',
    detail:
      'Payout periods are calendar months. A sale on 3 March and a sale on 31 March are both in the March statement and both paid on 5 April. No minimum, no holding period, bank transfer or PayPal.',
  },
  {
    term: 'Promote us honestly',
    detail:
      `Self referrals, cookie stuffing, spam, paid search on our brand terms and invented features or prices all get an account closed, and a closed account voids pending commission. If you are not sure whether a promotion is allowed, ask us at ${EMAIL} before you publish it.`,
  },
];

const faqs = [
  {
    question: 'How much commission does the affiliate program pay?',
    answer:
      'A percentage of the order value. The rate is set per affiliate and we agree yours in writing when you join, so there is no single public number. Once a sale is paid, your rate is frozen onto it, which means a later rate change never reduces commission you have already earned.',
  },
  {
    question: 'How long does the tracking link last?',
    answer:
      'Thirty days. The click is stored in a cookie in the visitor’s browser, and attribution is checked again at the moment they pay, so a purchase on day 31 earns nothing. Cookies are per browser and per device, so a click on a phone and a purchase on a laptop will not be connected.',
  },
  {
    question: 'Do I earn commission on repeat purchases?',
    answer:
      'No. Commission is due on a customer’s first paid purchase only. If that email address has already paid through any affiliate, there is no commission on that order or on anything they buy afterwards. It is a new customer program rather than a recurring revenue share.',
  },
  {
    question: 'When and how do you pay affiliates?',
    answer:
      'Payouts run on the 5th of each month and cover the previous calendar month, so a sale on 3 March and a sale on 31 March are both paid on 5 April. There is no minimum payout and no holding period. We pay by bank transfer or PayPal, whichever you prefer, and we cover the transfer fee.',
  },
  {
    question: 'What happens to my commission if the customer gets a refund?',
    answer:
      'A refunded order earns nothing. If the refund happens before payout, the order simply drops off that month’s statement. If it lands after we have already paid you, we absorb the loss and never claw the commission back, deduct it from a later statement, or invoice you for it.',
  },
  {
    question: `How do I join the ${BRAND_NAME} affiliate program?`,
    answer:
      `Email ${EMAIL} and tell us where you would promote us. We review applications by hand, so it is not instant, and we can decline without giving a reason. If we approve you, we send your nine digit affiliate ID, your tracking link and your commission rate.`,
  },
];

export function generateMetadata() {
  return buildMetadata(meta);
}

export default function Page() {
  const graph = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage(meta),
    buildFAQPage({
      canonical: meta.canonical,
      title: 'Affiliate Program FAQs',
      description: meta.description,
      faqs,
    }),
    buildBreadcrumbList({ paths: breadcrumb }),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
      />
      <PageHero
        paths={breadcrumb}
        title={`${BRAND_NAME} Affiliate Program`}
        subtitle={`Send travellers who need a verifiable flight reservation our way and earn a share of what they pay. You get a tracking link that works on any page of the site, 30 days of first touch attribution, and a payout on the 5th of every month. Applications go to ${EMAIL}.`}
        points={[
          'Commission on a new customer’s first paid order',
          '30 day first touch cookie',
          'Paid on the 5th, no minimum',
          'Bank transfer or PayPal',
        ]}
      />

      <QuickAnswer
        question={`What is the ${BRAND_NAME} affiliate program?`}
        answer={`It pays you a share of what your readers spend. You get a tracking link carrying your nine digit affiliate ID, and anyone who clicks it is credited to you for 30 days. If they buy from ${BRAND_NAME} for the first time inside that window, you earn an agreed percentage of the order. We pay on the 5th of the following month, with no minimum.`}
      />

      <Process
        title="How To Join In Three Steps"
        subtitle="Applications by email, reviewed by a person"
        steps={joinSteps}
      />

      <Benefits
        title="What You Actually Get"
        subtitle="The mechanics, not the sales pitch"
        benefits={benefits}
      />

      <TermsSummary
        title="Read This Before You Promote Us"
        subtitle="These are the rules that decide what you earn, so they are on the page rather than buried in a PDF."
        items={terms}
        footnote="Rates and terms can change, and we give 30 days notice by email before they do. Changes are never applied backwards, so sales already made keep the rate that was frozen onto them."
      />

      <FAQ
        title="Affiliate Program FAQs"
        subtitle="The questions partners ask before they sign up"
        faqs={faqs}
      />

      <Contact
        title="Ready to apply?"
        text={`Email us with your site, your audience and how you would promote ${BRAND_NAME}, and we will come back to you with a rate and your tracking link. Questions about whether a promotion is allowed are welcome before you publish, not after.`}
        email={EMAIL}
        whatsappNumber={WHATSAPP_NUMBER}
        faqHref="#faq"
      />
    </>
  );
}
