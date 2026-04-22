import Navbar from '@travel-suite/frontend-shared/components/v2/sections/Navbar';
import Footer from '@travel-suite/frontend-shared/components/v2/sections/Footer';
import TestimonialCard from '@travel-suite/frontend-shared/components/v2/TestimonialCard';
import Link from 'next/link';
import {
  ShieldCheck,
  Award,
  Globe,
  Clock,
  Zap,
  Lock,
  ArrowRight,
  ThumbsUp,
  Search,
} from 'lucide-react';

export const metadata = {
  title: 'About Us — TravelShield',
  description:
    'TravelShield is an independent travel insurance comparison platform helping UAE residents compare and buy cover from leading insurers — quickly and for free.',
};

const STATS = [
  {
    value: '2022',
    label: 'Year founded',
    sub: 'Helping travellers from day one',
  },
  {
    value: '15+',
    label: 'Partner insurers',
    sub: 'Leading underwriters worldwide',
  },
  { value: '150+', label: 'Countries covered', sub: 'Every major destination' },
  { value: '50k+', label: 'Quotes generated', sub: 'And counting' },
  { value: '4.8★', label: 'Customer rating', sub: 'Based on verified reviews' },
  { value: 'Free', label: 'To use', sub: 'No fees, ever' },
];

const VALUES = [
  {
    Icon: Search,
    title: 'Independent Comparison',
    body: 'We are not tied to any single insurer. We compare plans from multiple partners and present the options that genuinely match your trip and budget — nothing more, nothing less.',
  },
  {
    Icon: ShieldCheck,
    title: 'Honest Advice',
    body: 'No jargon, no pressure. We explain what each policy covers and what it does not — in plain language — so you can choose with confidence.',
  },
  {
    Icon: Zap,
    title: 'Speed When It Matters',
    body: 'From quote to policy certificate in minutes. No paper forms, no long waits. Your documents arrive in your inbox the moment payment is confirmed.',
  },
  {
    Icon: Globe,
    title: 'Built for UAE Residents',
    body: 'We understand the specific needs of residents buying travel insurance in the UAE — local regulations, popular destinations, visa requirements, and the insurers who serve this market best.',
  },
  {
    Icon: Lock,
    title: 'Your Data, Protected',
    body: 'We share your details only with the insurer you choose, only when you decide to buy. We never sell your information to third parties for marketing purposes.',
  },
  {
    Icon: ThumbsUp,
    title: 'Support Throughout',
    body: 'Questions before you buy? Need help reading your policy documents? We are here at every step — not just at the point of sale.',
  },
];

const MILESTONES = [
  {
    year: '2022',
    title: 'TravelShield founded',
    body: 'Launched with a mission to make travel insurance simpler and more transparent for residents across the UAE.',
  },
  {
    year: '2023',
    title: 'First 10,000 quotes',
    body: 'Reached our first major milestone and expanded partnerships with regional and international insurers.',
  },
  {
    year: '2024',
    title: '15+ insurer partners',
    body: 'Built a network of leading underwriters covering single-trip, annual, family, and specialist plans.',
  },
  {
    year: '2025',
    title: '50,000+ quotes served',
    body: 'Helping more UAE residents than ever to compare, understand, and purchase travel insurance that genuinely fits their trips.',
  },
];

const TESTIMONIALS = [
  {
    quote:
      'Found a policy that covered my pre-existing condition in minutes. The comparison was clear and the price was better than going direct to the insurer.',
    name: 'Ahmed K.',
    location: 'Dubai, UAE',
    stars: 5,
    plan: 'Annual Multi-Trip',
  },
  {
    quote:
      'I always found travel insurance confusing. TravelShield made it simple — plain explanations, no surprises, and a great price.',
    name: 'Sarah M.',
    location: 'Abu Dhabi, UAE',
    stars: 5,
    plan: 'Single Trip',
  },
  {
    quote:
      'Bought cover for a family of five for our Europe trip. The family plan options were well explained and the whole process was seamless.',
    name: 'Priya R.',
    location: 'Sharjah, UAE',
    stars: 5,
    plan: 'Family',
  },
];

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900 font-sans">
      <Navbar />
      <main className="flex-1">
        <section className="relative bg-linear-to-br from-primary-700 via-primary-600 to-accent-500 text-white overflow-hidden">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-[350px] h-[350px] rounded-full bg-white/5 pointer-events-none" />
          <div className="relative max-w-4xl mx-auto px-6 py-24 md:py-32 text-center">
            <span className="inline-block bg-white/15 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-6 tracking-wide uppercase">
              Who We Are
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight">
              Travel insurance,{' '}
              <span className="text-accent-200">done right</span>
            </h1>
            <p className="mt-6 text-lg text-primary-100 leading-relaxed max-w-2xl mx-auto">
              TravelShield is an independent travel insurance comparison
              platform. We help UAE residents compare policies from leading
              insurers, understand what they are buying, and get covered in
              minutes — completely free of charge.
            </p>
          </div>
        </section>

        <section className="bg-gray-50 border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {STATS.map(({ value, label, sub }) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-extrabold text-primary-700">
                  {value}
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-800">
                  {label}
                </p>
                <p className="mt-0.5 text-xs text-gray-400 leading-snug">
                  {sub}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-block bg-primary-100 text-primary-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-5 tracking-wide uppercase">
              Our Story
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold leading-tight text-gray-900">
              Built to give travellers better choices.
            </h2>
            <p className="mt-5 text-gray-500 leading-relaxed">
              We started TravelShield because buying travel insurance in the UAE
              was harder than it should be. Most platforms either pushed a
              single insurer&apos;s products or buried the important details in
              fine print.
            </p>
            <p className="mt-4 text-gray-500 leading-relaxed">
              We are not an insurer. We are an independent intermediary — which
              means our only job is to help you find the policy that is
              genuinely right for your trip. We partner with leading
              underwriters and present their plans side by side, with clear
              explanations of what is and is not covered.
            </p>
            <p className="mt-4 text-gray-500 leading-relaxed">
              Once you choose a policy and pay, your certificate is issued by
              the insurer and sent straight to your inbox. If you need to make a
              claim, you deal directly with the insurer — and we are here to
              help you navigate that process if you need us.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-primary-700 rounded-2xl p-6 text-white row-span-2 flex flex-col justify-between">
              <ShieldCheck size={32} className="text-primary-300" />
              <div>
                <p className="text-3xl font-extrabold">Free</p>
                <p className="text-primary-200 text-sm mt-1">
                  Our comparison service costs you nothing. We earn a commission
                  from insurers — not from you — and it does not affect the
                  price you pay.
                </p>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <Award size={24} className="text-amber-500 mb-3" />
              <p className="font-bold text-gray-900 text-sm">Independent</p>
              <p className="text-xs text-gray-400 mt-1">
                Not tied to any single insurer
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <Clock size={24} className="text-primary-600 mb-3" />
              <p className="font-bold text-gray-900 text-sm">Instant cover</p>
              <p className="text-xs text-gray-400 mt-1">
                Policy in your inbox in minutes
              </p>
            </div>
          </div>
        </section>

        <section className="bg-gray-50 py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-14">
              <span className="inline-block bg-primary-100 text-primary-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-4 tracking-wide uppercase">
                What We Stand For
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
                Our Values
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {VALUES.map(({ Icon, title, body }) => (
                <div
                  key={title}
                  className="bg-white rounded-2xl border border-gray-200 p-7 shadow-sm"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center mb-5">
                    <Icon size={18} className="text-primary-700" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <span className="inline-block bg-primary-100 text-primary-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-4 tracking-wide uppercase">
              Our Journey
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
              How We Got Here
            </h2>
          </div>
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200 hidden sm:block" />
            <div className="flex flex-col gap-10">
              {MILESTONES.map(({ year, title, body }, i) => (
                <div key={year} className="flex gap-6 items-start">
                  <div className="relative shrink-0 w-10 flex flex-col items-center sm:flex">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-extrabold z-10 ${
                        i === MILESTONES.length - 1
                          ? 'bg-primary-700 text-white'
                          : 'bg-white border-2 border-primary-300 text-primary-700'
                      }`}
                    >
                      {year.slice(2)}
                    </div>
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2.5 py-0.5 rounded-full sm:hidden">
                        {year}
                      </span>
                      <span className="text-xs font-bold text-primary-600 hidden sm:inline">
                        {year}
                      </span>
                      <h3 className="font-bold text-gray-900">{title}</h3>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-gray-50 py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-14">
              <span className="inline-block bg-primary-100 text-primary-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-4 tracking-wide uppercase">
                Customers
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">
                What Travellers Say
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t) => (
                <TestimonialCard key={t.name} {...t} />
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="bg-primary-50 border border-primary-100 rounded-3xl p-10 text-center">
            <span className="inline-block bg-primary-100 text-primary-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-4 tracking-wide uppercase">
              How We Work
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-4">
              We compare. You choose. The insurer covers you.
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-sm leading-relaxed">
              TravelShield earns a commission from our insurance partners when
              you purchase a policy through our platform. This is how we keep
              the service free for you. We are required to disclose this — and
              we do so proudly — because it does not affect the price you pay.
              The premium is identical to buying direct from the insurer.
            </p>
          </div>
        </section>

        <section className="bg-primary-700 text-white py-20">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold leading-tight">
              Ready to find your policy?
            </h2>
            <p className="mt-4 text-primary-200 text-lg">
              Compare plans from leading insurers. Get a quote in seconds —
              it&apos;s free.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/insurance-booking/quote"
                className="inline-flex items-center justify-center gap-2 bg-white text-primary-700 hover:bg-primary-50 font-bold px-8 py-4 rounded-full text-sm transition-colors"
              >
                Get a Free Quote <ArrowRight size={15} />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 border border-white/40 hover:bg-white/10 text-white font-semibold px-8 py-4 rounded-full text-sm transition-colors"
              >
                Talk to Us
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
