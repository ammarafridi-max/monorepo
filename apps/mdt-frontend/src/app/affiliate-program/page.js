import { getBrand } from '@travel-suite/config';
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

const brand = getBrand('mdt');
const EMAIL = brand.emails.support;
const BRAND_NAME = brand.name;

export const revalidate = 86400;

const meta = {
  title: `${BRAND_NAME} Affiliate Program | Commission On New Customers`,
  description: `Join the ${BRAND_NAME} affiliate program. A tracking link that works sitewide, 30 days of first touch attribution, and commission on every new customer's first paid order, paid on the 5th of each month.`,
  canonical: `${SITE_URL}/affiliate-program`,
};

const breadcrumb = [
  { label: 'Home', path: '/' },
  { label: 'Affiliate Program', path: '/affiliate-program' },
];

const joinSteps = [
  {
    title: 'Email us about your audience',
    text: `Write to ${EMAIL} and tell us where you would promote us, whether that is a blog, a visa consultancy, a newsletter or a social following. Every application is read by a person, so it is not instant.`,
  },
  {
    title: 'Get your ID, link and rate',
    text: 'If we approve you, we set up your account and send your nine digit affiliate ID, your tracking link and your commission rate in writing. You know the number before you publish anything.',
  },
  {
    title: 'Publish the link and get paid',
    text: `Add ?affId= plus your ID to any page on ${brand.domain}, point readers at whichever page suits the post, and we settle the month on the 5th of the next one.`,
  },
];

const benefits = [
  {
    title: 'Deep Link Anywhere On The Site',
    text: `Your link is https://www.${brand.domain}/?affId= plus your nine digit ID, and the affId is read on any page, not only the homepage. A post about travel insurance can link straight to the insurance page and still credit you.`,
    icon: HiOutlineLink,
  },
  {
    title: 'Your Rate Is Locked Onto Each Sale',
    text: 'Commission is a percentage of the order value, and the rate is written onto each sale the moment the customer pays. If your rate changes later, what you have already earned stays exactly as it was.',
    icon: HiOutlineLockClosed,
  },
  {
    title: 'No Minimum, And We Pay The Fee',
    text: 'A single order is enough to trigger a payout. No minimum, no holding period, bank transfer or PayPal as you prefer, and the transfer fee is ours so the amount that arrives matches your statement.',
    icon: HiOutlineBanknotes,
  },
];

const terms = [
  {
    term: 'First paid purchase only',
    detail:
      'Commission is due on a customer’s first paid order. If that email address has already paid through any affiliate, there is no commission on that order or on anything they buy later. This is a new customer program, not a recurring revenue share, so aim your promotion at people who have not bought from us before.',
  },
  {
    term: 'The 30 day window is hard',
    detail:
      'A click is stored in the visitor’s browser for 30 days, and attribution is rechecked at the moment they pay. A purchase on day 31 earns nothing. Cookies are per browser and per device too, so a click on a phone and a purchase on a laptop will not join up.',
  },
  {
    term: 'First touch wins',
    detail:
      'If a visitor already carries unexpired attribution from another affiliate, your click does not replace it. The same rule works in your favour when you got there first, because nobody can overwrite you later.',
  },
  {
    term: 'Refunds cancel commission',
    detail:
      'A refunded order earns nothing. Refunded before payout, it simply drops off that month’s statement. Refunded after we have paid you, we absorb the loss. We will not claw the commission back, net it off a later statement, or invoice you for it.',
  },
  {
    term: 'Paid monthly on the 5th',
    detail:
      'Payout periods are calendar months. A sale on 3 March and a sale on 31 March both sit in the March statement and both get paid on 5 April. No minimum, no holding period, bank transfer or PayPal.',
  },
  {
    term: 'Promote us honestly',
    detail:
      `Self referrals, cookie stuffing, spam, paid search on our brand terms and invented features or prices all get an account closed, and a closed account voids pending commission. If you are unsure whether something is allowed, ask us at ${EMAIL} before you publish it.`,
  },
];

const faqs = [
  {
    question: 'How much commission does the affiliate program pay?',
    answer:
      'A percentage of the order value. The rate is set per affiliate and agreed with you in writing when you join, so there is no single public number. Once a sale is paid, your rate is frozen onto it, which means a later rate change never reduces commission you have already earned.',
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
        subtitle={`Point travellers who need a verifiable flight reservation or travel insurance our way and earn a share of what they pay. You get a tracking link that works sitewide, 30 days of first touch attribution, and a payout on the 5th of every month. Applications go to ${EMAIL}.`}
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
        text={`Email us with your site, your audience and how you would promote ${BRAND_NAME}, and we will reply with a rate and your tracking link. Ask us about a promotion before you publish it rather than after, we would always rather answer the question.`}
        email={EMAIL}
        faqHref="#faq"
      />
    </>
  );
}
