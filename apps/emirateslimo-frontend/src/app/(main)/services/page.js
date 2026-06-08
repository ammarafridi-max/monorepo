import Link from 'next/link';
import PrimarySection from '@/components/PrimarySection';
import Container from '@/components/Container';
import PageHero from '@/components/Sections/PageHero';

export const metadata = {
  title: 'Dubai Chauffeur & Airport Transfer Services | Emirates Limo',
  description:
    'Premium airport transfers, chauffeur service, hourly chauffeur, and car hire with driver in Dubai. Luxury vehicles and professional drivers.',
  alternates: { canonical: 'https://www.emirateslimo.com/services' },
  robots: { index: true, follow: true },
};

const services = [
  {
    image: 'airport-transfer.webp',
    title: 'Airport Transfers',
    text: 'Enjoy a seamless Dubai airport transfer experience with meet-and-greet service, 60 minutes of free waiting time, flight tracking, and professional chauffeurs. Whether you are arriving or departing, we ensure your journey from the airport to your destination is smooth, comfortable, and stress-free.',
    link: '/dubai-airport-transfer',
  },
  {
    image: 'chauffeur-service.webp',
    title: 'Chauffeur Service',
    text: 'Travel in complete comfort with our premium chauffeur service in Dubai. Perfect for business travel, city journeys, events, family trips, and VIP transportation. Our experienced chauffeurs are professional, multilingual, and trained to deliver a safe, private, and luxurious travel experience across the UAE.',
    link: '/chauffeur-service',
  },
  {
    image: 'city-to-city-rides.webp',
    title: 'Car Hire With Driver',
    text: 'Hire a car with driver in Dubai and enjoy the convenience of having a professional chauffeur dedicated to your journey. Whether you need transportation for city travel, hotel pickups, business meetings, sightseeing, or day-to-day travel, we provide luxury vehicles with reliable and courteous drivers.',
    link: '/car-hire-with-driver-dubai',
  },
  {
    image: 'city-tours.webp',
    title: 'Hourly Chauffeur',
    text: 'Need flexible transportation? Our hourly chauffeur service allows you to hire a private driver for as long as you need. Ideal for meetings, errands, shopping trips, events, and full-day travel — giving you complete freedom to move around Dubai with a professional chauffeur always at your service.',
    link: '/hourly-chauffeur',
  },
];

export default function Services() {
  const total = services.length;

  return (
    <>
      <PageHero
        paths={[
          { label: 'Home', href: '/' },
          { label: 'Services', href: '/services' },
        ]}
        title="Chauffeur & Airport Transfer Services in Dubai"
        subtitle="Premium Transportation Across the UAE"
      />

      <PrimarySection className="py-15 lg:py-20">
        <Container>
          <div className="flex flex-col gap-20 lg:gap-28">
            {services.map((service, i) => (
              <div
                key={i}
                className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center"
              >
                {/* Image */}
                <div className={`relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 ${i % 2 !== 0 ? 'lg:order-2' : ''}`}>
                  <img
                    src={service.image}
                    alt={service.title}
                    loading="lazy"
                    className="h-full w-full object-cover object-center transition-transform duration-700 hover:scale-105"
                  />
                  {/* Subtle service number watermark */}
                  <div className="absolute bottom-4 right-5 text-[72px] font-light text-white/10 leading-none select-none pointer-events-none">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                </div>

                {/* Content */}
                <div className={i % 2 !== 0 ? 'lg:order-1' : ''}>
                  {/* Eyebrow */}
                  <div className="flex items-center gap-3 mb-5">
                    <span className="h-px w-6 bg-accent-500 flex-shrink-0" />
                    <p className="text-[10.5px] tracking-[0.25em] font-light uppercase text-accent-600">
                      {String(i + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
                    </p>
                  </div>

                  <h2 className="text-[27px] lg:text-[34px] font-light leading-[1.2] tracking-tight text-primary-900 mb-5">
                    {service.title}
                  </h2>

                  <p className="text-[15.5px] font-light leading-[1.9] text-gray-600">{service.text}</p>

                  <Link
                    href={service.link}
                    className="mt-7 inline-flex items-center gap-2 text-[13.5px] font-light text-accent-600 hover:text-accent-700 tracking-wide group"
                  >
                    <span>Explore Service</span>
                    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </PrimarySection>
    </>
  );
}
