import { Mail, MessageCircle } from 'lucide-react';
import Container from '@travel-suite/frontend-shared/components/shared/layout/Container';
import PrimarySection from '@travel-suite/frontend-shared/components/shared/layout/PrimarySection';
import SectionTitle from '@travel-suite/frontend-shared/components/shared/layout/SectionTitle';
import Faqs from '@travel-suite/frontend-shared/components/sections/v2/Faqs';
import { buildMetadata } from '@/lib/schema';
import {
  buildFAQPage,
  buildGraph,
  buildOrganization,
  buildWebPage,
  buildWebsite,
} from '@/lib/schema';

const EMAIL = 'info@travl.ae';
const WHATSAPP_NUMBER = '+971569964924';
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}`;

const steps = [
  {
    n: '1',
    title: 'Gather your documents',
    text:
      'Your policy number, a short description of what happened with the dates, and any supporting paperwork. Medical reports, original receipts, a police report for theft, or airline notices for delays and cancellations.',
  },
  {
    n: '2',
    title: 'Get in touch',
    text:
      'Email or WhatsApp us with everything you have. There is no online portal here. A real person on the team picks it up and walks you through what AXA needs.',
  },
  {
    n: '3',
    title: 'Submit and follow up',
    text:
      'We submit the claim to AXA in the format they expect and keep you updated as it moves. If anything extra is needed, we tell you exactly what.',
  },
];

const claimTypes = [
  {
    title: 'Medical and hospital',
    text:
      'Doctor or hospital report, prescriptions, itemised bills, payment receipts.',
  },
  {
    title: 'Trip cancellation or delay',
    text:
      'Original booking confirmations, the airline notice or other proof of cancellation, receipts for extra costs.',
  },
  {
    title: 'Lost or damaged baggage',
    text:
      'The Property Irregularity Report (PIR) the airline gave you at the airport, plus receipts for essentials.',
  },
];

const faqs = [
  {
    question: 'How do I start a claim?',
    answer:
      'Email info@travl.ae or WhatsApp us at +971 56 996 4924. Include your policy number, what happened, the dates involved, and any documents you already have. We will reply with the next steps.',
  },
  {
    question: 'How long does a claim take?',
    answer:
      'Once a complete claim is with AXA, processing times depend on the claim type and how much back and forth is needed for documents. We push for the fastest possible outcome and keep you updated. We will not give you a guaranteed timeline up front because that depends on factors outside our control.',
  },
  {
    question: 'Do I need to call AXA myself?',
    answer:
      'For most claims, no. We act as the point of contact and submit the paperwork on your behalf. For medical emergencies happening right now, your policy includes AXA emergency assistance numbers printed on the policy document. Use those first, then let us know so we can support the claim afterwards.',
  },
  {
    question: 'Is there a deadline for filing a claim?',
    answer:
      'Yes. Most travel insurance policies require you to notify the insurer within a set number of days after the event (often 30 to 60 days, depending on the claim type). Check your policy schedule for the exact window, or send it to us and we will read it for you. Filing late is the most common reason claims get rejected, so reach out as soon as you can.',
  },
  {
    question: 'What if my claim is rejected?',
    answer:
      'If AXA declines a claim, they explain why in writing. We help you read through the decision, identify whether any extra evidence could change the outcome, and put together a response if it makes sense to push back. Some rejections are final under the policy wording, and we will tell you honestly when that is the case.',
  },
];

const meta = {
  title: 'Make a Claim — Travl Travel Insurance',
  description:
    'Need to claim on your AXA travel insurance policy from Travl? Email or WhatsApp our team in Dubai and a real person will walk you through it.',
  canonical: 'https://www.travl.ae/claims',
};

export const metadata = buildMetadata(meta);

export default function Page() {
  const graph = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage(meta),
    buildFAQPage({
      canonical: meta.canonical,
      title: 'Travel Insurance Claims FAQ',
      description: meta.description,
      faqs,
    }),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
      />

      {/* Header */}
      <PrimarySection className="bg-gray-50 pt-14 pb-10 md:pt-20 md:pb-14">
        <Container className="max-w-3xl">
          <nav className="text-xs text-gray-400 mb-4">
            <a href="/" className="hover:text-gray-700">Home</a>
            <span className="mx-2 text-gray-300">/</span>
            <span className="text-gray-600">Make a Claim</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Make a Claim
          </h1>
          <p className="text-base md:text-lg text-gray-600 leading-relaxed">
            If something happened on your trip and you need to claim on your
            AXA policy, get in touch. There is no online portal. You email or
            WhatsApp us and a real person walks you through it.
          </p>
        </Container>
      </PrimarySection>

      {/* Steps */}
      <PrimarySection className="py-12 md:py-16">
        <Container className="max-w-3xl">
          <SectionTitle className="mb-8">How it works</SectionTitle>
          <ol className="flex flex-col gap-6">
            {steps.map(({ n, title, text }) => (
              <li key={n} className="flex gap-4">
                <span className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary-50 text-primary-700 text-sm font-bold">
                  {n}
                </span>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    {title}
                  </h3>
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                    {text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </PrimarySection>

      {/* Claim types */}
      <PrimarySection className="py-12 md:py-16 bg-gray-50/60">
        <Container className="max-w-3xl">
          <SectionTitle className="mb-2">What kind of claim do you have?</SectionTitle>
          <p className="text-sm md:text-base text-gray-600 mb-8">
            Send us a short description and we will tell you exactly which
            documents to gather.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {claimTypes.map(({ title, text }) => (
              <div
                key={title}
                className="rounded-2xl border border-gray-200 bg-white p-5"
              >
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  {title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </Container>
      </PrimarySection>

      {/* Contact CTA */}
      <PrimarySection className="py-12 md:py-16">
        <Container className="max-w-3xl">
          <div className="rounded-3xl border border-primary-100 bg-[linear-gradient(145deg,#f5fbfb_0%,#eff7ff_55%,#fff7f0_100%)] p-8 md:p-10 text-center">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              Ready to start your claim?
            </h2>
            <p className="text-sm md:text-base text-gray-600 mb-6 max-w-xl mx-auto">
              Email or WhatsApp the team with your policy number and what
              happened. We respond on both.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href={`mailto:${EMAIL}?subject=Insurance%20Claim`}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold transition-colors"
              >
                <Mail size={16} aria-hidden="true" />
                Email {EMAIL}
              </a>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-primary-200 bg-white hover:border-primary-400 text-gray-700 hover:text-primary-700 text-sm font-semibold transition-colors"
              >
                <MessageCircle size={16} aria-hidden="true" />
                WhatsApp us
              </a>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              For medical emergencies in progress, call the AXA assistance
              number on your policy document first.
            </p>
          </div>
        </Container>
      </PrimarySection>

      <Faqs
        title="Claims — Frequently Asked Questions"
        subtitle="What to expect, what to gather, and what to do if something goes wrong"
        faqs={faqs}
      />
    </>
  );
}
