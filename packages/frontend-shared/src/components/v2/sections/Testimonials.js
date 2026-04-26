import TestimonialCard from '../cards/TestimonialCard.js';

const defaultTestimonials = [
  {
    quote:
      'My flight got cancelled in Tokyo — TravelShield covered my hotel and rebooked flight within hours. Absolute lifesaver.',
    name: 'Sarah M.',
    location: 'London, UK',
    stars: 5,
    plan: 'Single Trip',
  },
  {
    quote:
      "Broke my leg skiing in Austria. The medical team arranged my evacuation and covered every bill. Couldn't believe how smooth it was.",
    name: 'Carlos R.',
    location: 'Madrid, Spain',
    stars: 5,
    plan: 'Adventure',
  },
  {
    quote:
      'As a digital nomad I needed annual multi-trip cover. TravelShield is the only one that made sense price-wise and the app is great.',
    name: 'Priya K.',
    location: 'Singapore',
    stars: 5,
    plan: 'Annual Multi-Trip',
  },
];

export default function Testimonials({
  title = 'What Travellers Say',
  testimonials = defaultTestimonials,
}) {
  return (
    <section className="max-w-7xl mx-auto px-6 py-20">
      <div className="text-center mb-14">
        <h2 className="text-3xl md:text-4xl font-bold">{title}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((t) => (
          <TestimonialCard key={t.name} {...t} />
        ))}
      </div>
    </section>
  );
}
