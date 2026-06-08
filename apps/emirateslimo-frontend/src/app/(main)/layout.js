import Navigation from '@/components/Navigation';
import MobileNavigation from '@/components/MobileNavigation';
import Footer from '@/components/Footer';
import WhatsAppCTA from '@/components/WhatsAppCTA';

export default function MainLayout({ children }) {
  return (
    <div className="min-h-dvh w-full flex flex-col">
      <MobileNavigation />
      <Navigation />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppCTA />
    </div>
  );
}
