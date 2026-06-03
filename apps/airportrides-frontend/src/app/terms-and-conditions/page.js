import Link from 'next/link';
import Container from '@travel-suite/frontend-shared/components/shared/layout/Container';
import PageHero from '@/sections/PageHero';
import { SITE_URL } from '@/config';

export const metadata = {
  title: 'Terms & Conditions – AirportRides',
  description:
    'Read the Terms & Conditions governing the use of AirportRides — covering bookings, payments, cancellations, and liability.',
  alternates: { canonical: `${SITE_URL}/terms-and-conditions` },
};

const paths = [
  { label: 'Home', path: '/' },
  { label: 'Terms & Conditions', path: '/terms-and-conditions' },
];

function Section({ heading, children }) {
  return (
    <div className="mt-12 first:mt-0">
      <h2 className="font-display text-2xl font-semibold text-ink mb-5 pb-3 border-b border-sand-300">
        {heading}
      </h2>
      <ul className="flex flex-col gap-3 text-ink-soft leading-relaxed list-none">
        {children}
      </ul>
    </div>
  );
}

function Item({ children }) {
  return (
    <li className="flex gap-3">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-clay-500" />
      <span>{children}</span>
    </li>
  );
}

export default function TermsAndConditionsPage() {
  return (
    <>
      <PageHero
        title="Terms & Conditions"
        subtitle="By using AirportRides or placing a booking through our platform, you agree to these Terms & Conditions. Please read them carefully before proceeding."
        paths={paths}
      />

      <section className="py-16 md:py-20">
        <Container>
          <p className="text-sm text-ink-mute mb-10">Last updated: May 2025</p>
          <div className="max-w-3xl">

            <Section heading="General Information">
              <Item>
                AirportRides is an airport transfer marketplace connecting travellers with
                professional drivers and transfer operators worldwide.
              </Item>
              <Item>
                These Terms &amp; Conditions apply to all users of the AirportRides website
                (airportrides.com) and any services booked through it.
              </Item>
              <Item>
                Our services are intended for legitimate travel purposes only. Misuse is strictly
                prohibited and may result in cancellation without refund.
              </Item>
            </Section>

            <Section heading="Booking & Payments">
              <Item>
                All bookings are subject to availability and confirmation. A booking is confirmed
                only once you receive a confirmation email from AirportRides.
              </Item>
              <Item>
                Payments are processed securely via Stripe. AirportRides does not store your card
                details on our servers.
              </Item>
              <Item>
                Prices displayed are inclusive of all applicable fees unless stated otherwise. No
                hidden charges are added at checkout.
              </Item>
              <Item>
                You must be at least 18 years old, or have parental/guardian consent, to make a
                booking.
              </Item>
            </Section>

            <Section heading="Cancellations & Refunds">
              <Item>
                Free cancellation is available up to 24 hours before your scheduled pick-up time.
                Cancellations made within 24 hours may be subject to a cancellation fee.
              </Item>
              <Item>
                No-shows (failure to appear at the agreed pick-up point without prior notice) are
                non-refundable.
              </Item>
              <Item>
                If AirportRides or the transfer operator cancels your booking, you will receive a
                full refund within 5–10 business days.
              </Item>
              <Item>
                Refund requests must be submitted via{' '}
                <a
                  href="mailto:info@airportrides.com"
                  className="text-clay-600 underline underline-offset-2"
                >
                  info@airportrides.com
                </a>{' '}
                within 48 hours of the scheduled journey.
              </Item>
            </Section>

            <Section heading="User Responsibilities">
              <Item>
                You are responsible for providing accurate booking information — including flight
                number, pick-up address, and passenger count. AirportRides is not liable for
                issues arising from incorrect information.
              </Item>
              <Item>
                Please be at the agreed pick-up location on time. Drivers will wait a reasonable
                grace period (typically 30–60 minutes for flight arrivals, 10 minutes for other
                pick-ups).
              </Item>
              <Item>
                You agree to treat drivers and vehicles with respect. Damage caused to vehicles
                will be charged to the booking holder.
              </Item>
            </Section>

            <Section heading="Service Limitations">
              <Item>
                AirportRides acts as an intermediary between passengers and transfer operators. We
                are not the direct provider of the transportation service.
              </Item>
              <Item>
                Journey times are estimates and may be affected by traffic, weather, or other
                factors beyond our control.
              </Item>
              <Item>
                We do not guarantee that a specific vehicle type, driver, or operator will be
                assigned to your booking; however, all meet our quality standards.
              </Item>
            </Section>

            <Section heading="Flight Monitoring">
              <Item>
                For airport pick-ups, we monitor your flight and adjust pick-up times
                automatically for delays of up to 60 minutes at no extra charge.
              </Item>
              <Item>
                For delays exceeding 60 minutes, please contact us directly so we can coordinate
                with your driver.
              </Item>
            </Section>

            <Section heading="Intellectual Property">
              <Item>
                All content on AirportRides — including text, graphics, logos, and software — is
                owned by AirportRides and is protected by copyright and intellectual property law.
              </Item>
              <Item>
                You may not copy, reproduce, distribute, or create derivative works from any
                content on this site without written permission.
              </Item>
            </Section>

            <Section heading="Disclaimer of Liability">
              <Item>
                AirportRides is not liable for delays, missed connections, or losses resulting
                from circumstances beyond our reasonable control, including traffic conditions,
                extreme weather, or strikes.
              </Item>
              <Item>
                Our total liability for any claim arising from a booking is limited to the amount
                paid for that booking.
              </Item>
              <Item>
                We are not responsible for items left in vehicles. Please report lost items as
                soon as possible — we will do our best to assist recovery.
              </Item>
            </Section>

            <Section heading="Privacy Policy">
              <Item>
                Your personal data is processed in accordance with our{' '}
                <Link
                  href="/privacy-policy"
                  className="text-clay-600 underline underline-offset-2 hover:text-clay-700"
                >
                  Privacy Policy
                </Link>
                , which forms part of these Terms &amp; Conditions.
              </Item>
            </Section>

            <Section heading="Amendments">
              <Item>
                AirportRides reserves the right to update or modify these Terms &amp; Conditions at
                any time. The &ldquo;last updated&rdquo; date will reflect changes.
              </Item>
              <Item>
                Continued use of our website or services after updates constitutes acceptance of
                the revised Terms.
              </Item>
            </Section>

            <Section heading="Governing Law">
              <Item>
                These Terms &amp; Conditions are governed by the laws of the United Arab Emirates.
              </Item>
              <Item>
                Any disputes arising from the use of AirportRides fall under the exclusive
                jurisdiction of UAE courts.
              </Item>
              <Item>
                For disputes or complaints, please contact us first at{' '}
                <a
                  href="mailto:info@airportrides.com"
                  className="text-clay-600 underline underline-offset-2"
                >
                  info@airportrides.com
                </a>
                . We aim to resolve all issues within 5 business days.
              </Item>
            </Section>

          </div>
        </Container>
      </section>
    </>
  );
}
