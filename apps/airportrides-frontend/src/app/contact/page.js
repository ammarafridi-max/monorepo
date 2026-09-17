import Container from '@travel-suite/frontend-shared/components/shared/layout/Container';
import PageHero from '@/sections/PageHero';
import { Mail, MessageSquare, MapPin, Clock } from 'lucide-react';

const paths = [
  { label: 'Home', path: '/' },
  { label: 'Contact', path: '/contact' },
];

const contactMethods = [
  {
    icon: Mail,
    label: 'Email us',
    value: 'info@airportrides.com',
    href: 'mailto:info@airportrides.com',
    sub: 'We reply within 24 hours',
  },
  {
    icon: MessageSquare,
    label: 'WhatsApp',
    value: '+971 XX XXX XXXX',
    href: 'https://wa.me/971XXXXXXXX',
    sub: 'Fastest response for urgent queries',
  },
  {
    icon: MapPin,
    label: 'Headquarters',
    value: 'Dubai, UAE',
    href: null,
    sub: 'Serving 40+ cities worldwide',
  },
  {
    icon: Clock,
    label: 'Support hours',
    value: '24 / 7',
    href: null,
    sub: 'Around the clock, every day of the year',
  },
];


export default function ContactPage() {
  return (
    <>
      <PageHero
        title="Get in Touch"
        subtitle="Whether you have a question about a booking, need help with a transfer, or just want to say hello — we're here for you."
        paths={paths}
      />

      <section className="py-16 md:py-24">
        <Container>
          <div className="max-w-2xl mx-auto">

            <div>
              <h2 className="font-display text-2xl font-semibold text-ink mb-8">
                Ways to reach us
              </h2>
              <div className="flex flex-col gap-5">
                {contactMethods.map(({ icon: Icon, label, value, href, sub }) => (
                  <div
                    key={label}
                    className="flex items-start gap-4 rounded-card bg-sand-100 border border-sand-200 p-5"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-clay-50 border border-clay-100">
                      <Icon size={18} className="text-clay-600" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink">{label}</p>
                      {href ? (
                        <a
                          href={href}
                          className="text-clay-600 hover:text-clay-700 transition-colors text-sm"
                        >
                          {value}
                        </a>
                      ) : (
                        <p className="text-sm text-ink">{value}</p>
                      )}
                      <p className="text-xs text-ink-mute mt-0.5">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </Container>
      </section>
    </>
  );
}
