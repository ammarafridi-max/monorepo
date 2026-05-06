import PrimarySection from '../../shared/layout/PrimarySection.js';
import Container from '../../shared/layout/Container.js';
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
    icon: Zap,
    title: 'Instant Policy Issuance',
    text: 'Buy cover in under 3 minutes and receive your policy certificate immediately by email — no waiting, no paperwork.',
  },
  {
    icon: FileCheck,
    title: '72-Hour Claim Resolution',
    text: 'Our dedicated claims team targets a full resolution within 72 hours of receiving your documents. No chasing required.',
  },
  {
    icon: Headphones,
    title: '24/7 Emergency Helpline',
    text: "A real person answers every call, day or night. Whether it's a hospital admission or a missed connection, we're on it.",
  },
  {
    icon: Banknote,
    title: 'No Hidden Fees',
    text: 'The price you see is the price you pay. No admin fees, no processing charges, no nasty surprises at checkout.',
  },
  {
    icon: Lock,
    title: 'Transparent Policy Wording',
    text: "We rewrote our policy documents in plain English. If something isn't covered, we say so clearly — upfront.",
  },
  {
    icon: RefreshCw,
    title: 'Flexible & Extendable',
    text: 'Plans change. Extend your trip, upgrade your cover, or add adventure sports at any point before your departure.',
  },
];

export default function Benefits({
  title = 'Built around you, not the small print',
  subtitle = 'We designed every part of TravelShield to remove the friction that makes insurance frustrating.',
  benefits = defaultBenefits,
}) {
  return (
    <PrimarySection className="bg-gray-900 text-white py-20">
      <Container>
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-extrabold">{title}</h2>
          <p className="mt-3 text-gray-400 max-w-lg mx-auto">{subtitle}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10 rounded-2xl overflow-hidden">
          {benefits.map((benefit, i) => {
            const Icon = benefit.icon;
            return (
              <div
                key={i}
                className="bg-gray-900 p-8 flex flex-col gap-4 hover:bg-gray-800 transition-colors"
              >
                {Icon && (
                  <div className="w-11 h-11 rounded-xl bg-primary-500/15 flex items-center justify-center">
                    <Icon size={20} className="text-primary-400" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-white">{benefit.title}</h3>
                  <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                    {benefit.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </PrimarySection>
  );
}
