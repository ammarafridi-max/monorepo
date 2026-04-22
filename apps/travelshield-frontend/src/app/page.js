import Navbar from '@travel-suite/frontend-shared/components/v2/sections/Navbar';
import Hero from '@travel-suite/frontend-shared/components/v2/sections/Hero';
import TrustBadges from '@travel-suite/frontend-shared/components/v2/sections/TrustBadges';
import Coverage from '@travel-suite/frontend-shared/components/v2/sections/Coverage';
import About from '@travel-suite/frontend-shared/components/v2/sections/About';
import HowItWorks from '@travel-suite/frontend-shared/components/v2/sections/HowItWorks';
import Benefits from '@travel-suite/frontend-shared/components/v2/sections/Benefits';
import Testimonials from '@travel-suite/frontend-shared/components/v2/sections/Testimonials';
import Faqs from '@travel-suite/frontend-shared/components/v2/sections/Faqs';
import CtaBanner from '@travel-suite/frontend-shared/components/v2/sections/CtaBanner';
import Footer from '@travel-suite/frontend-shared/components/v2/sections/Footer';

export const metadata = {
  title: 'TravelShield — Compare Travel Insurance in the UAE',
  description:
    'Compare travel insurance plans from leading insurers. Get an instant quote for medical cover, trip cancellations, baggage, and more — free to use.',
};

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900 font-sans">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <TrustBadges />
        <Coverage />
        <About />
        <HowItWorks />
        <Benefits />
        <Testimonials />
        <Faqs />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
}
