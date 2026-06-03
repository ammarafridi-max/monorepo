import {
  Search,
  CreditCard,
  Car,
  Lock,
  PlaneLanding,
  Languages,
  Baby,
  Briefcase,
  Users,
  UserRound,
  ShieldCheck,
  Headphones,
} from 'lucide-react';

import HeroSection from '@/sections/HeroSection';
import HowItWorksSection from '@/sections/HowItWorksSection';
import WhyBookSection from '@/sections/WhyBookSection';
import DestinationsSection from '@/sections/DestinationsSection';
import TravelerTypesSection from '@/sections/TravelerTypesSection';
import TrustSection from '@/sections/TrustSection';
import FaqSection from '@/sections/FaqSection';
import FinalCtaSection from '@/sections/FinalCtaSection';

const steps = [
  {
    n: '01',
    icon: Search,
    title: `Tell us where you're going`,
    text: `Enter your airport and destination. We check trusted local drivers and show you a fixed price upfront.`,
  },
  {
    n: '02',
    icon: CreditCard,
    title: `Book in two minutes`,
    text: `Confirm your details and pay securely. You get instant confirmation and your driver's details before your trip.`,
  },
  {
    n: '03',
    icon: Car,
    title: `Get picked up, stress-free`,
    text: `Your driver tracks your flight and waits for you, even if you land late. No queues, no haggling, no meter anxiety.`,
  },
];

const valueProps = [
  {
    icon: Lock,
    title: `Fixed price, locked in`,
    text: `The price you see is the price you pay. No meters, no surge pricing, no "the traffic was bad" surcharges at the end.`,
  },
  {
    icon: PlaneLanding,
    title: `Your driver knows your flight`,
    text: `We track your arrival. Land early or late, your driver adjusts. You'll never pay for their waiting time.`,
  },
  {
    icon: Languages,
    title: `No language barriers`,
    text: `Drivers are briefed with your details in advance. No explaining your hotel address to someone who doesn't speak your language at midnight.`,
  },
  {
    icon: Car,
    title: `Skip the airport taxi line`,
    text: `Walk past the queue. Your driver is waiting at arrivals with your name, ready to go.`,
  },
];

const destinations = [
  { city: 'Dubai', code: 'DXB', span: 'col-span-2 row-span-2', grad: 'from-clay-700 via-clay-800 to-clay-900', big: true },
  { city: 'Abu Dhabi', code: 'AUH', span: 'lg:col-span-2', grad: 'from-honey-600 to-clay-800' },
  { city: 'London', code: 'LHR', span: 'lg:col-span-2', grad: 'from-ink to-ink' },
  { city: 'Istanbul', code: 'IST', span: 'lg:col-span-2', grad: 'from-clay-800 to-ink' },
  { city: 'Bangkok', code: 'BKK', span: '', grad: 'from-ink to-clay-900' },
  { city: 'Barcelona', code: 'BCN', span: '', grad: 'from-sand-500 to-clay-800' },
  { city: 'Paris', code: 'CDG', span: 'lg:col-span-2', grad: 'from-clay-900 to-ink' },
  { city: 'Rome', code: 'FCO', span: 'col-span-2 lg:col-span-2', grad: 'from-ink via-clay-800 to-clay-900' },
];

const travelerTypes = [
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

const trustPillars = [
  {
    icon: ShieldCheck,
    title: `Vetted drivers`,
    text: `Every driver is screened and rated. We work with established local operators, not random pickups.`,
  },
  {
    icon: Lock,
    title: `Secure payment`,
    text: `Pay online through encrypted, secure checkout. Your card details are never shared with the driver.`,
  },
  {
    icon: Headphones,
    title: `Real support, any hour`,
    text: `Flight delayed at 3am? Driver running late? Our team is reachable around the clock, wherever you are.`,
  },
];

const faqs = [
  {
    q: `How far in advance should I book?`,
    a: `We recommend booking at least 24 hours before your flight to guarantee availability, especially during peak travel seasons. Last-minute bookings are often possible, but earlier is safer.`,
  },
  {
    q: `What happens if my flight is delayed?`,
    a: `Your driver tracks your flight in real time and adjusts pickup automatically. You won't be charged extra for reasonable delays.`,
  },
  {
    q: `Is the price really fixed?`,
    a: `Yes. The price you're quoted is the total you pay. No meters, no surge pricing, no hidden fees added at the end of your trip.`,
  },
  {
    q: `Can I cancel my booking?`,
    a: `Most bookings can be cancelled free of charge up to a set time before your pickup. The exact terms are shown clearly before you pay.`,
  },
  {
    q: `What if I can't find my driver?`,
    a: `Your booking includes your driver's contact details and clear pickup instructions. If anything goes wrong, our 24/7 support team will connect you right away.`,
  },
  {
    q: `Do you cover my city?`,
    a: `We're live in over 40 cities and adding more every week. Enter your airport above to check availability, or sign up to be notified when we launch near you.`,
  },
];

export default function HomePage() {
  return (
    <>
      <HeroSection
        eyebrow="Airport transfers, sorted"
        title="Your ride is waiting"
        titleEm="before you land"
        subtitle="Pre-booked airport transfers in over 40 cities worldwide. Fixed prices, professional drivers, no surge, no surprises."
      />

      <HowItWorksSection
        eyebrow="The easy part"
        title="How it works"
        subtitle="Three steps from landing to your destination."
        steps={steps}
      />

      <WhyBookSection
        eyebrow="Worth the two minutes"
        title="Why travelers book their ride before they fly"
        subtitle="A little planning turns the most stressful part of any trip into the easiest."
        items={valueProps}
      />

      <DestinationsSection
        eyebrow="Where we roam"
        title="Airport transfers in popular destinations"
        subtitle="Tap a city to see transfers from its main airport."
        destinations={destinations}
        moreCitiesHref="#launch"
        moreCitiesText="Get notified when we launch in your destination."
      />

      <TravelerTypesSection
        eyebrow="However you travel"
        title="Whatever you're traveling for, we've got the ride"
        subtitle="One service, built to fit how you travel."
        travelerTypes={travelerTypes}
      />

      <TrustSection
        eyebrow="Peace of mind"
        title="Booked with confidence"
        subtitle="The reassurance that comes from a service built around your trip."
        pillars={trustPillars}
      />

      <FaqSection
        eyebrow="Good to know"
        title="Common questions about airport transfers"
        subtitle="Everything you need to know before you book."
        faqs={faqs}
      />

      <FinalCtaSection
        title="Ready for a smoother arrival?"
        subtitle="Book your airport transfer in minutes and start your trip the easy way."
        ctaHref="#book"
        ctaLabel="Find your transfer"
        notifyLabel="Or get notified when we launch in your city"
        notifyBtnLabel="Notify me"
      />
    </>
  );
}
