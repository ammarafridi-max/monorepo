import {
  Zap,
  FileCheck,
  Headphones,
  Banknote,
  Lock,
  RefreshCw,
} from 'lucide-react';

const defaultBenefits = [
  {
    Icon: Zap,
    title: 'Instant Policy Issuance',
    desc: 'Buy cover in under 3 minutes and receive your policy certificate immediately by email — no waiting, no paperwork.',
  },
  {
    Icon: FileCheck,
    title: '72-Hour Claim Resolution',
    desc: 'Our dedicated claims team targets a full resolution within 72 hours of receiving your documents. No chasing required.',
  },
  {
    Icon: Headphones,
    title: '24/7 Emergency Helpline',
    desc: "A real person answers every call, day or night. Whether it's a hospital admission or a missed connection, we're on it.",
  },
  {
    Icon: Banknote,
    title: 'No Hidden Fees',
    desc: 'The price you see is the price you pay. No admin fees, no processing charges, no nasty surprises at checkout.',
  },
  {
    Icon: Lock,
    title: 'Transparent Policy Wording',
    desc: "We rewrote our policy documents in plain English. If something isn't covered, we say so clearly — upfront.",
  },
  {
    Icon: RefreshCw,
    title: 'Flexible & Extendable',
    desc: 'Plans change. Extend your trip, upgrade your cover, or add adventure sports at any point before your departure.',
  },
];

export default function Benefits({
  subtitle = 'Why TravelShield',
  title = 'Built around you, not the small print',
  description = 'We designed every part of TravelShield to remove the friction that makes insurance frustrating.',
  benefits = defaultBenefits,
}) {
  return (
    <section className="bg-gray-900 text-white py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="inline-block bg-white/10 text-primary-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-5 tracking-wide uppercase">
            {subtitle}
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold">{title}</h2>
          <p className="mt-3 text-gray-400 max-w-lg mx-auto">{description}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10 rounded-2xl overflow-hidden">
          {benefits.map(({ Icon, title, desc }) => (
            <div
              key={title}
              className="bg-gray-900 p-8 flex flex-col gap-4 hover:bg-gray-800 transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-primary-500/15 flex items-center justify-center">
                <Icon size={20} className="text-primary-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
