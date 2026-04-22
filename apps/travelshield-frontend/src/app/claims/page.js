import Navbar from '@travel-suite/frontend-shared/components/v2/sections/Navbar';
import Footer from '@travel-suite/frontend-shared/components/v2/sections/Footer';
import Link from 'next/link';
import {
  AlertCircle,
  FileText,
  Phone,
  CheckCircle2,
  ClipboardList,
  Search,
  CreditCard,
  Ambulance,
  ShieldAlert,
  PlaneTakeoff,
  BriefcaseBusiness,
  HeartPulse,
  ArrowRight,
  Info,
} from 'lucide-react';

export const metadata = {
  title: 'How to Make a Claim — TravelShield',
  description:
    'Need to make a travel insurance claim? Find out how to contact your insurer, what documents you need, and how the claims process works.',
};

const STEPS = [
  {
    number: '01',
    Icon: Search,
    title: 'Locate your policy documents',
    body: "Find the policy certificate and schedule that were emailed to you when you purchased. These contain your policy number, the insurer's name, and their emergency and claims contact details.",
  },
  {
    number: '02',
    Icon: Phone,
    title: 'Contact your insurer directly',
    body: 'For emergencies — medical, evacuation, or any situation requiring immediate help — call the 24/7 emergency helpline on your policy certificate right away. For non-urgent claims, use the claims contact or online portal listed in your policy documents.',
  },
  {
    number: '03',
    Icon: ClipboardList,
    title: 'Gather your supporting documents',
    body: 'The insurer will tell you exactly what they need. Common requirements include: medical reports and receipts, airline cancellation letters, police reports for theft, proof of ownership for lost items, and your booking confirmation.',
  },
  {
    number: '04',
    Icon: CheckCircle2,
    title: 'Submit your claim and follow up',
    body: "Submit your claim and documents through the insurer's preferred channel — online portal, email, or post. Keep copies of everything you send and note your claim reference number.",
  },
];

const CLAIM_TYPES = [
  {
    Icon: HeartPulse,
    title: 'Medical Emergency',
    docs: [
      'Medical reports and diagnosis',
      'Original receipts for all expenses',
      'Proof you called the emergency helpline first',
      'Discharge summary if hospitalised',
    ],
  },
  {
    Icon: PlaneTakeoff,
    title: 'Trip Cancellation or Curtailment',
    docs: [
      'Booking confirmations and invoices',
      'Proof of cancellation from airline or hotel',
      'Evidence of the reason (medical certificate, death certificate, etc.)',
      'Refunds already received from other sources',
    ],
  },
  {
    Icon: BriefcaseBusiness,
    title: 'Baggage Loss or Damage',
    docs: [
      'Property Irregularity Report (PIR) from the airline',
      'Police report for theft',
      'Original purchase receipts or proof of ownership',
      'Insurer claim form completed in full',
    ],
  },
  {
    Icon: AlertCircle,
    title: 'Travel Delay',
    docs: [
      'Written confirmation of delay from airline or carrier',
      'Original ticket and booking confirmation',
      'Receipts for additional costs incurred (meals, accommodation)',
    ],
  },
  {
    Icon: ShieldAlert,
    title: 'Personal Liability',
    docs: [
      'Details of the incident and any third-party claims',
      'Do not admit liability or make payments without insurer approval',
      'Police or incident report if available',
      'Contact details of any witnesses',
    ],
  },
  {
    Icon: CreditCard,
    title: 'Emergency Cash or Legal Expenses',
    docs: [
      'Police report confirming loss of cash or documents',
      'Evidence of the emergency giving rise to the need',
      'All receipts for expenses incurred',
    ],
  },
];

function FaqItem({ q, a }) {
  return (
    <details className="group border border-gray-200 rounded-2xl overflow-hidden">
      <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer font-semibold text-gray-900 text-sm select-none list-none">
        {q}
        <span className="shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold group-open:rotate-45 transition-transform">
          +
        </span>
      </summary>
      <p className="px-6 pb-5 text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-4">
        {a}
      </p>
    </details>
  );
}

const FAQS = [
  {
    q: 'Does TravelShield handle my claim?',
    a: 'No. TravelShield is an insurance intermediary — we help you compare and purchase policies, but the insurance contract is between you and the insurer. All claims are assessed and paid by the insurer named on your policy certificate. Contact them directly using those details.',
  },
  {
    q: 'What is the claims contact number for my insurer?',
    a: 'The emergency helpline and claims contact details are printed on your policy certificate, which was emailed to you when you purchased. If you cannot find it, contact us and we will help you locate the right number.',
  },
  {
    q: 'How long does a claim take to be processed?',
    a: 'This varies by insurer and by the type and complexity of the claim. Straightforward claims are often assessed within a few business days of receiving all required documentation. Complex claims involving medical assessments or liability may take longer. Your insurer will keep you updated.',
  },
  {
    q: 'What if my claim is rejected?',
    a: "If you believe your claim has been wrongly rejected, you have the right to follow the insurer's formal complaints process, which will be set out in your policy documents. If you remain unsatisfied, you may be able to refer the matter to an independent dispute resolution service.",
  },
  {
    q: 'Can I claim for a pre-existing medical condition?',
    a: 'Only if it was declared at the time of purchase and accepted by the insurer. If you declared a condition and it was accepted, it should be covered subject to the policy terms. If it was not declared, it will almost certainly be excluded. Always check your policy schedule for specific condition coverage details.',
  },
  {
    q: 'I need help understanding my policy documents. Can TravelShield help?',
    a: 'Yes — while we cannot make claims decisions, we are happy to help you understand your policy wording or point you to the right insurer contact. Reach out to us via the Contact page.',
  },
];

export default function ClaimsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900 font-sans">
      <Navbar />
      <main className="flex-1">
        {/* -- Hero -- */}
        <section className="relative bg-linear-to-br from-primary-900 via-primary-800 to-primary-700 text-white overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-white/5" />
            <div className="absolute bottom-0 -left-24 w-80 h-80 rounded-full bg-white/5" />
          </div>
          <div className="relative max-w-4xl mx-auto px-6 py-20 md:py-28 text-center">
            <span className="inline-block bg-white/15 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-6 tracking-wide uppercase">
              Claims Guide
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight">
              How to make a claim
            </h1>
            <p className="mt-5 text-primary-200 text-lg max-w-2xl mx-auto leading-relaxed">
              Claims are handled directly by your insurer — not by TravelShield.
              Here is everything you need to know to start the process quickly
              and correctly.
            </p>
          </div>
        </section>

        {/* -- Emergency notice -- */}
        <section className="bg-red-50 border-b border-red-200">
          <div className="max-w-5xl mx-auto px-6 py-5 flex items-start gap-4">
            <Ambulance size={20} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 leading-relaxed">
              <span className="font-bold">Medical emergency?</span> Do not wait
              — call the 24/7 emergency helpline printed on your policy
              certificate immediately. If you cannot find it, call your local
              emergency services first, then contact your insurer.
            </p>
          </div>
        </section>

        {/* -- Intermediary notice -- */}
        <section className="bg-amber-50 border-b border-amber-100">
          <div className="max-w-5xl mx-auto px-6 py-5 flex items-start gap-4">
            <Info size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 leading-relaxed">
              <span className="font-bold">
                TravelShield is an insurance intermediary.
              </span>{' '}
              We help you compare and purchase travel insurance, but the insurer
              named on your policy certificate is responsible for assessing and
              paying all claims. Contact your insurer directly for everything
              claims-related.
            </p>
          </div>
        </section>

        {/* -- Steps -- */}
        <section className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <span className="inline-block bg-primary-100 text-primary-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-4 tracking-wide uppercase">
              Step by Step
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
              How the claims process works
            </h2>
            <p className="mt-4 text-gray-500 max-w-xl mx-auto">
              Follow these steps to make sure your claim is submitted correctly
              and processed as quickly as possible.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {STEPS.map(({ number, Icon, title, body }) => (
              <div
                key={number}
                className="bg-white border border-gray-200 rounded-2xl p-7 shadow-sm flex gap-5"
              >
                <div className="shrink-0">
                  <div className="w-11 h-11 rounded-xl bg-primary-700 flex items-center justify-center">
                    <Icon size={18} className="text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-primary-600 mb-1">
                    {number}
                  </p>
                  <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* -- Documents by claim type -- */}
        <section className="bg-gray-50 py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-14">
              <span className="inline-block bg-primary-100 text-primary-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-4 tracking-wide uppercase">
                Document Checklist
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
                What documents will I need?
              </h2>
              <p className="mt-4 text-gray-500 max-w-xl mx-auto">
                Requirements vary by claim type. Below are the most commonly
                requested documents for each category. Your insurer may ask for
                additional items.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {CLAIM_TYPES.map(({ Icon, title, docs }) => (
                <div
                  key={title}
                  className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                      <Icon size={18} className="text-primary-700" />
                    </div>
                    <h3 className="font-bold text-gray-900">{title}</h3>
                  </div>
                  <ul className="flex flex-col gap-2">
                    {docs.map((doc) => (
                      <li key={doc} className="flex items-start gap-2">
                        <FileText
                          size={13}
                          className="text-primary-500 shrink-0 mt-0.5"
                        />
                        <span className="text-xs text-gray-500 leading-relaxed">
                          {doc}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* -- FAQs -- */}
        <section className="max-w-3xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <span className="inline-block bg-primary-100 text-primary-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-4 tracking-wide uppercase">
              FAQs
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
              Common questions about claims
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            {FAQS.map((faq) => (
              <FaqItem key={faq.q} {...faq} />
            ))}
          </div>
        </section>

        {/* -- CTA -- */}
        <section className="bg-primary-50 border-t border-primary-100 py-16">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-3">
              Can&apos;t find your insurer&apos;s contact details?
            </h2>
            <p className="text-gray-500 text-sm max-w-xl mx-auto mb-8 leading-relaxed">
              If you have lost your policy documents or cannot locate the claims
              contact for your insurer, get in touch. We will help you find the
              right number as quickly as possible.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-800 text-white font-bold px-8 py-4 rounded-full text-sm transition-colors"
              >
                Contact Us <ArrowRight size={15} />
              </Link>
              <Link
                href="/insurance-booking/quote"
                className="inline-flex items-center justify-center gap-2 border border-primary-300 hover:bg-primary-100 text-primary-700 font-semibold px-8 py-4 rounded-full text-sm transition-colors"
              >
                Get a New Quote
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
