import PrimarySection from '@/components/PrimarySection';
import Container from '@/components/Container';
import SectionTitle from '@/components/SectionTitle';
import ServiceCard from '@/components/ServiceCard';
import PageHero from '@/components/Sections/PageHero';
import { services } from '@/data/services';

export const metadata = {
  title: 'About Emirates Limo | Luxury Chauffeur Dubai',
  description:
    'Discover Emirates Limo, a premium chauffeur and airport transfer company in Dubai dedicated to luxury service, professional drivers, and seamless travel.',
  alternates: { canonical: 'https://www.emirateslimo.com/about-us' },
  robots: { index: true, follow: true },
};

const highlights = [
  { label: 'Professional Chauffeurs', desc: 'Highly experienced, multilingual, and courteous drivers.' },
  { label: 'Luxury Fleet', desc: 'Sedans, SUVs, and executive vans — immaculately maintained.' },
  { label: 'Always On Time', desc: 'Real-time flight tracking and pre-scheduled pickups.' },
  { label: 'Transparent Pricing', desc: 'Fixed rates with no hidden charges, ever.' },
];

export default function AboutUs() {
  return (
    <>
      <PageHero
        paths={[{ label: 'Home', href: '/' }, { label: 'About Us', href: '/about-us' }]}
        title="About Emirates Limo | Luxury Chauffeur Dubai"
        subtitle="A premium chauffeur and luxury transportation company based in Dubai, dedicated to delivering exceptional comfort, professionalism, and reliability."
      />

      <PrimarySection className="py-15 lg:py-20">
        <Container>
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <SectionTitle subtitle="Our Story">Who We Are</SectionTitle>
              <p className="text-[15.5px] font-light leading-[1.9] text-gray-600 mt-6">
                Founded with a passion for hospitality and world-class service, Emirates Limo combines luxury vehicles,
                trained professional chauffeurs, and modern technology to create outstanding travel experiences across
                the UAE. Our commitment to excellence has made us a trusted choice for residents, tourists, executives,
                and VIP travelers.
              </p>
              <p className="text-[15.5px] font-light leading-[1.9] text-gray-600 mt-4">
                Our mission is simple — to provide a safe, premium, and dependable transportation service where every
                customer receives exceptional care, personalized attention, and total peace of mind.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {highlights.map((h, i) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl border border-gray-100 bg-white hover:border-accent-200 hover:shadow-sm transition-all duration-300"
                >
                  <div className="w-2 h-2 rounded-full bg-accent-500 mb-3" />
                  <h3 className="text-[15px] font-light text-primary-900 mb-1">{h.label}</h3>
                  <p className="text-[13.5px] font-light text-gray-500 leading-relaxed">{h.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-18">
            <SectionTitle subtitle="What We Do">What We Offer</SectionTitle>
            <ul className="mt-6 grid sm:grid-cols-2 gap-3">
              {[
                'Professional chauffeur services across Dubai and the UAE.',
                'Reliable airport transfers with flight monitoring and meet & greet.',
                'Luxury vehicles including sedans, SUVs, and executive vans.',
                'Corporate travel, events transportation, and VIP travel experiences.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-[14.5px] font-light text-gray-600 leading-relaxed">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-accent-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-18">
            <SectionTitle subtitle="Our Services">Services We Provide</SectionTitle>
            <div className="mt-8 flex gap-6 overflow-x-auto lg:grid lg:grid-cols-3 lg:overflow-visible">
              {services.map((service, i) => (
                <ServiceCard
                  key={i}
                  href={service.href}
                  text={service.text}
                  title={service.title}
                  image={service.image}
                />
              ))}
            </div>
          </div>

          <div className="mt-18">
            <SectionTitle subtitle="Our Promise">Our Commitment</SectionTitle>
            <p className="mt-6 text-[15.5px] font-light leading-[1.9] text-gray-600 max-w-3xl">
              We are committed to ensuring every ride reflects excellence, safety, and luxury. Every journey with
              Emirates Limo is carefully managed — from booking to drop-off — so you can simply relax and enjoy the
              experience.
            </p>
          </div>

          <div className="mt-14 p-8 rounded-2xl bg-primary-900 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <p className="text-[10.5px] tracking-[0.22em] uppercase text-accent-400 mb-2">Get in Touch</p>
              <h3 className="text-[22px] font-light text-white">We would love to assist you</h3>
            </div>
            <div className="flex flex-col gap-2 text-[14px] font-light text-white/55">
              <a href="mailto:contact@emirateslimo.com" className="hover:text-accent-400 transition-colors duration-300">
                contact@emirateslimo.com
              </a>
              <a href="tel:+971569964924" className="hover:text-accent-400 transition-colors duration-300">
                +971 56 996 4924
              </a>
            </div>
          </div>
        </Container>
      </PrimarySection>
    </>
  );
}
