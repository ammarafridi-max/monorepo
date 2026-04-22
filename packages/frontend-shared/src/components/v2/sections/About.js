import Link from 'next/link';
import { ShieldCheck, Users, Award, ThumbsUp } from 'lucide-react';

const defaultCredentials = [
  { Icon: ShieldCheck, label: 'FCA regulated & fully licensed' },
  { Icon: Users, label: '500k+ customers worldwide' },
  { Icon: Award, label: 'Best Insurer — TravelAwards 2024' },
  { Icon: ThumbsUp, label: '98% customer satisfaction rate' },
];

const defaultStats = [
  {
    value: '2018',
    label: 'Year founded',
    sub: 'Over 6 years protecting travellers',
  },
  {
    value: '150+',
    label: 'Countries covered',
    sub: 'Every continent on the planet',
  },
  {
    value: '72 hrs',
    label: 'Avg. claim resolution',
    sub: 'Fast, fair, and transparent',
  },
  { value: '$10M', label: 'Max medical cover', sub: 'Per person, per trip' },
];

export default function About({
  title = 'We built TravelShield because travel should be worry-free',
  description = 'Founded in 2018, TravelShield started with a simple mission: make travel insurance honest, affordable, and actually useful. Too many travellers were being let down by confusing policies, hidden exclusions, and slow claims. We set out to fix that.',
  credentials = defaultCredentials,
  stats = defaultStats,
}) {
  return (
    <section className="bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <span className="inline-block bg-primary-100 text-primary-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-5 tracking-wide uppercase">
            About TravelShield
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold leading-tight text-gray-900">
            {title}
          </h2>
          <p className="mt-4 text-gray-500 leading-relaxed">{description}</p>
          <div className="mt-8 grid grid-cols-2 gap-5">
            {credentials.map(({ Icon, label }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="mt-0.5 w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-primary-700" />
                </div>
                <span className="text-sm text-gray-600 leading-snug">
                  {label}
                </span>
              </div>
            ))}
          </div>
          <Link
            href="/about"
            className="mt-10 inline-flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold px-6 py-3 rounded-full transition-colors"
          >
            Our full story →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-5">
          {stats.map(({ value, label, sub }) => (
            <div
              key={label}
              className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
            >
              <p className="text-3xl font-extrabold text-primary-700">
                {value}
              </p>
              <p className="mt-1 font-semibold text-gray-900 text-sm">
                {label}
              </p>
              <p className="mt-1 text-xs text-gray-400 leading-snug">{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
