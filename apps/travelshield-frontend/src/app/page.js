import Navbar from '@travel-suite/frontend-shared/components/sections/v2/Navbar';
import Hero from '@travel-suite/frontend-shared/components/sections/v2/Hero';
import TrustBadges from '@travel-suite/frontend-shared/components/sections/v2/TrustBadges';
import Coverage from '@travel-suite/frontend-shared/components/sections/v2/Coverage';
import About from '@travel-suite/frontend-shared/components/sections/v2/About';
import HowItWorks from '@travel-suite/frontend-shared/components/sections/v2/HowItWorks';
import Benefits from '@travel-suite/frontend-shared/components/sections/v2/Benefits';
import Testimonials from '@travel-suite/frontend-shared/components/sections/v2/Testimonials';
import Faqs from '@travel-suite/frontend-shared/components/sections/v2/Faqs';
import CtaBanner from '@travel-suite/frontend-shared/components/sections/v2/CtaBanner';
import Footer from '@travel-suite/frontend-shared/components/sections/v2/Footer';

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
