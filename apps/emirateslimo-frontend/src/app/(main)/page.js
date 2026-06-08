import { LuClock, LuShieldCheck, LuCar, LuCalendarX } from 'react-icons/lu';
import { chauffeurFaqs } from '@/data/faqs';
import { chauffeurTestimonials } from '@/data/testimonials';
import Hero from '@/components/HomeComponents/Hero';
import Services from '@/components/HomeComponents/Services';
import Process from '@/components/HomeComponents/Process';
import Fleet from '@/components/HomeComponents/Fleet';
import WhyBookEmiratesLimo from '@/components/HomeComponents/WhyBookEmiratesLimo';
import Testimonials from '@/components/HomeComponents/Testimonials';
import FAQs from '@/components/HomeComponents/FAQs';
import BlogPosts from '@/components/Sections/BlogPosts';
import ServiceCta from '@/components/ServiceCta';

export const metadata = {
  title: 'Emirates Limo | Luxury Chauffeur & Transfers Dubai',
  description:
    'Emirates Limo offers premium chauffeur and airport transfer services across Dubai and the UAE. Book luxury rides with professional drivers today.',
  alternates: {
    canonical: 'https://www.emirateslimo.com',
  },
  robots: { index: true, follow: true },
};

const benefits = [
  {
    icon: LuCar,
    title: 'Luxury Fleet',
    text: 'Experience ultimate comfort in our luxury Sedans, SUVs, and Vans, all impeccably maintained and chauffeur-driven.',
  },
  {
    icon: LuShieldCheck,
    title: 'Experienced Chauffeurs',
    text: 'Our professional chauffeurs ensure a safe, comfortable, private, and punctual ride — every time, for every traveler.',
  },
  {
    icon: LuClock,
    title: 'Always On Time',
    text: 'Your time is important to us. We offer real-time tracking and pre-scheduled bookings to ensure timely pickup and dropoff.',
  },
  {
    icon: LuCalendarX,
    title: 'Flexible Cancellation',
    text: 'Plans change, and we understand. Receive 100% refund when you cancel at least 24 hours before the pick up time.',
  },
];

export default function Home() {
  return (
    <>
      <Hero
        title="Book Your Dubai Chauffeur & Airport Transfer"
        subtitle="Luxury Chauffeur & Airport Transfers"
        text="Premium chauffeur services and airport transfers across Dubai and the UAE with professional drivers and luxury vehicles."
      />
      <Services title="Premium Chauffeur Experiences in Dubai" subtitle="Our Services" />
      <Process title="Book Your Ride in 4 Easy Steps" subtitle="Our Process" />
      <Fleet title="Luxury Vehicles To Choose From" subtitle="Our Fleet" />
      <WhyBookEmiratesLimo
        title="Why Book With Emirates Limo?"
        subtitle="Why Choose Us"
        benefits={benefits}
      />
      <Testimonials
        title="What Our Clients Say"
        subtitle="Client Testimonials"
        testimonials={chauffeurTestimonials}
      />
      <FAQs
        title="Frequently Asked Questions"
        subtitle="FAQs"
        faqs={chauffeurFaqs}
        includeJsonLd
      />
      <BlogPosts title="From Our Blog" subtitle="Travel Tips & Insights" />
      <ServiceCta
        title="Ready to Book Your Luxury Ride?"
        text="Experience premium chauffeur service and airport transfers across Dubai and the UAE."
        primary={{ to: '/', label: 'Book Now' }}
        secondary={{ to: '/contact-us', label: 'Contact Us' }}
      />
    </>
  );
}
