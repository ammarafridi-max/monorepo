'use client';

import { useState } from 'react';
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

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink-soft">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  'w-full rounded-xl border border-sand-300 bg-sand-50 px-4 py-3 text-sm text-ink placeholder:text-ink-mute focus:border-clay-400 focus:outline-none focus:ring-2 focus:ring-clay-200 transition-colors';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    // TODO: wire to Brevo / backend contact endpoint
    console.log('Contact form submission:', form);
    setSent(true);
  }

  return (
    <>
      <PageHero
        title="Get in Touch"
        subtitle="Whether you have a question about a booking, need help with a transfer, or just want to say hello — we're here for you."
        paths={paths}
      />

      <section className="py-16 md:py-24">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">

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

            <div>
              <h2 className="font-display text-2xl font-semibold text-ink mb-8">
                Send a message
              </h2>

              {sent ? (
                <div className="rounded-card bg-clay-50 border border-clay-200 p-8 text-center">
                  <p className="font-display text-xl font-semibold text-clay-700 mb-2">
                    Message received!
                  </p>
                  <p className="text-ink-soft text-sm">
                    Thanks for reaching out. We&apos;ll get back to you within 24 hours.
                  </p>
                  <button
                    onClick={() => { setForm({ name: '', email: '', subject: '', message: '' }); setSent(false); }}
                    className="mt-6 text-sm text-clay-600 underline underline-offset-2 hover:text-clay-700"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <Field label="Your name">
                      <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        placeholder="Jane Smith"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Email address">
                      <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        placeholder="jane@example.com"
                        className={inputCls}
                      />
                    </Field>
                  </div>

                  <Field label="Subject">
                    <input
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      required
                      placeholder="Question about my booking"
                      className={inputCls}
                    />
                  </Field>

                  <Field label="Message">
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      placeholder="Tell us how we can help…"
                      className={`${inputCls} resize-none`}
                    />
                  </Field>

                  <button
                    type="submit"
                    className="self-start rounded-pill bg-clay-600 px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-clay-700"
                  >
                    Send message
                  </button>
                </form>
              )}
            </div>

          </div>
        </Container>
      </section>
    </>
  );
}
