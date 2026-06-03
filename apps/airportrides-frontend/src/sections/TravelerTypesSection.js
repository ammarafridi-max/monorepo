import Container from '@travel-suite/frontend-shared/components/shared/layout/Container';
import SectionHeading from './SectionHeading';
import { Baby, Briefcase, Users, UserRound } from 'lucide-react';

const DEFAULT_TRAVELER_TYPES = [
  {
    icon: Baby,
    title: `Families`,
    text: `Child seats, extra luggage space, and a driver who waits while you wrangle the kids. Travel with everyone in one vehicle.`,
  },
  {
    icon: Briefcase,
    title: `Business`,
    text: `Fixed receipts for expenses, professional drivers, and reliable timing for your meetings. Book a return trip in advance and forget about it.`,
  },
  {
    icon: Users,
    title: `Groups`,
    text: `Vans and larger vehicles for teams, friends, and tour groups. One booking, everyone arrives together.`,
  },
  {
    icon: UserRound,
    title: `Solo travelers`,
    text: `Vetted drivers, shared trip details, and 24/7 support. Arrive somewhere new without the airport-taxi gamble.`,
  },
];

export default function TravelerTypesSection({
  eyebrow = 'However you travel',
  title = "Whatever you're traveling for, we've got the ride",
  subtitle = 'One service, built to fit how you travel.',
  travelerTypes = DEFAULT_TRAVELER_TYPES,
}) {
  return (
    <section className="bg-sand-200 py-20 md:py-28">
      <Container>
        <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {travelerTypes.map(({ icon: Icon, title: cardTitle, text }) => (
            <div
              key={cardTitle}
              className="flex gap-5 rounded-card bg-sand-50 p-7 ring-1 ring-sand-300/70"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-honey-400/20 text-clay-600">
                <Icon size={22} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-ink">{cardTitle}</h3>
                <p className="mt-1.5 text-[15px] font-light leading-relaxed text-ink-soft">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
