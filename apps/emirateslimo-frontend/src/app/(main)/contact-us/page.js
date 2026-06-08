import {
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineClock,
  HiOutlineLocationMarker,
} from 'react-icons/hi';
import PageHero from '@/components/Sections/PageHero';
import PrimarySection from '@/components/PrimarySection';
import Container from '@/components/Container';
import SectionTitle from '@/components/SectionTitle';

export const metadata = {
  title: 'Contact Emirates Limo | Dubai Chauffeur & Transfers',
  description:
    'Contact Emirates Limo for chauffeur service and airport transfer bookings in Dubai and across the UAE. Reach our team by phone or email.',
  alternates: { canonical: 'https://www.emirateslimo.com/contact-us' },
  robots: { index: true, follow: true },
};

const channels = [
  {
    icon: HiOutlinePhone,
    label: 'Phone & WhatsApp',
    value: '+971 56 996 4924',
    href: 'tel:+971569964924',
    note: 'Available 24 / 7 for calls and messages',
  },
  {
    icon: HiOutlineMail,
    label: 'Email',
    value: 'contact@emirateslimo.com',
    href: 'mailto:contact@emirateslimo.com',
    note: 'We respond within a few hours',
  },
  {
    icon: HiOutlineClock,
    label: 'Operating Hours',
    value: '24 / 7 — 365 Days',
    href: null,
    note: 'Including weekends and public holidays',
  },
  {
    icon: HiOutlineLocationMarker,
    label: 'Service Area',
    value: 'Dubai & Across the UAE',
    href: null,
    note: 'Airport transfers, city rides, inter-emirate',
  },
];

const contactPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: 'Contact Emirates Limo',
  url: 'https://www.emirateslimo.com/contact-us',
  description:
    'Contact Emirates Limo for chauffeur service and airport transfer bookings in Dubai and across the UAE. Reach our team by phone or email.',
  mainEntity: {
    '@type': 'LimousineService',
    name: 'Emirates Limo',
    telephone: '+971569964924',
    url: 'https://www.emirateslimo.com',
  },
};

export default function ContactUs() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(contactPageSchema).replace(/</g, '\u003c'),
        }}
      />

      <PageHero
        paths={[
          { label: 'Home', href: '/' },
          { label: 'Contact Us', href: '/contact-us' },
        ]}
        title="Contact Us"
        subtitle="Available 24 hours, 7 days a week"
      />

      {/* Contact Channels */}
      <PrimarySection className="py-15 lg:py-20">
        <Container>
          <SectionTitle subtitle="Get In Touch" textAlign="center">
            How to Reach Us
          </SectionTitle>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {channels.map((ch, i) => {
              const Icon = ch.icon;
              const card = (
                <div className="group flex flex-col gap-4 p-6 rounded-2xl border border-gray-100 bg-white hover:border-accent-200 hover:shadow-sm transition-all duration-300 h-full">
                  <div className="w-11 h-11 rounded-xl bg-accent-50 border border-accent-100 flex items-center justify-center text-accent-600 transition-all duration-300 group-hover:bg-accent-500 group-hover:border-accent-500 group-hover:text-white shrink-0">
                    <Icon className="text-xl" />
                  </div>
                  <div>
                    <p className="text-[11px] tracking-[0.18em] uppercase font-light text-gray-400 mb-1">
                      {ch.label}
                    </p>
                    <p className="text-[15px] font-light text-primary-900 leading-snug">
                      {ch.value}
                    </p>
                    <p className="text-[13px] font-light text-gray-400 mt-1 leading-relaxed">
                      {ch.note}
                    </p>
                  </div>
                </div>
              );
              return ch.href ? (
                <a key={i} href={ch.href} className="block">
                  {card}
                </a>
              ) : (
                <div key={i}>{card}</div>
              );
            })}
          </div>

          {/* Bottom CTA */}
          <div className="mt-14 p-8 rounded-2xl bg-primary-900 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <p className="text-[10.5px] tracking-[0.22em] uppercase text-accent-400 mb-2">
                We Are Ready
              </p>
              <h3 className="text-[22px] font-light text-white">
                Have a special requirement?
              </h3>
              <p className="text-[14px] font-light text-white/50 mt-1 max-w-md leading-relaxed">
                VIP transfers, corporate accounts, large-group bookings — we are
                happy to assist with any request.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 shrink-0">
              <a
                href="mailto:contact@emirateslimo.com"
                className="inline-flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white text-[13.5px] font-light tracking-wide py-3 px-6 rounded-lg transition-colors duration-300"
              >
                Email Us
              </a>
              <a
                href="tel:+971569964924"
                className="text-white/45 hover:text-white text-[13px] font-light transition-colors duration-300"
              >
                or call +971 56 996 4924
              </a>
            </div>
          </div>
        </Container>
      </PrimarySection>
    </>
  );
}
