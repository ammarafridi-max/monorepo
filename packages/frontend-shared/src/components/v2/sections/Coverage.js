import Link from 'next/link';
import {
  HeartPulse,
  PlaneTakeoff,
  Briefcase,
  Clock,
  Mountain,
  Globe,
} from 'lucide-react';

const defaultItems = [
  {
    Icon: HeartPulse,
    title: 'Medical Emergencies',
    desc: 'Up to $10M in emergency medical and hospitalisation expenses, including emergency evacuation.',
  },
  {
    Icon: PlaneTakeoff,
    title: 'Trip Cancellation',
    desc: 'Reimbursement for prepaid, non-refundable costs if you must cancel due to illness, weather, or more.',
  },
  {
    Icon: Briefcase,
    title: 'Lost Luggage',
    desc: 'Compensation for lost, stolen, or damaged baggage and personal belongings.',
  },
  {
    Icon: Clock,
    title: 'Travel Delays',
    desc: 'Daily allowance for meals and accommodation when your journey is delayed by 6+ hours.',
  },
  {
    Icon: Mountain,
    title: 'Adventure Sports',
    desc: 'Optional add-on covering skiing, scuba diving, hiking, and 50+ adventure activities.',
  },
  {
    Icon: Globe,
    title: 'Annual Multi-Trip',
    desc: 'One policy for unlimited trips throughout the year — ideal for frequent travellers.',
  },
];

export default function Coverage({
  title = 'What We Cover',
  description = 'Pick the plan that fits your trip — from a weekend getaway to a year-long adventure.',
  items = defaultItems,
}) {
  return (
    <section className="max-w-7xl mx-auto px-6 py-20">
      <div className="text-center mb-14">
        <h2 className="text-3xl md:text-4xl font-bold">{title}</h2>
        <p className="text-gray-500 mt-3 max-w-lg mx-auto">{description}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(({ Icon, title, desc }) => (
          <div
            key={title}
            className="group bg-white border border-gray-200 rounded-2xl p-7 hover:border-primary-300 hover:shadow-lg transition-all"
          >
            <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center">
              <Icon className="text-primary-700" size={22} />
            </div>
            <h3 className="mt-4 font-semibold text-lg text-gray-900">
              {title}
            </h3>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">{desc}</p>
            <Link
              href="/plans"
              className="mt-5 inline-block text-sm font-semibold text-primary-700 group-hover:underline"
            >
              Learn more →
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
