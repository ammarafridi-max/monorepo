import Navigation from '@travel-suite/frontend-shared/components/v1/layout/Navigation';
import Footer from '@travel-suite/frontend-shared/components/v1/layout/Footer';
import MobileNavigation from '@travel-suite/frontend-shared/components/v1/layout/MobileNavigation';
import { defaultPages } from '@travel-suite/frontend-shared/components/v1/layout/Navigation';

export default function AppLayout({ children, pages = defaultPages }) {
  return (
    <>
      <Navigation pages={pages} logoAlt="Travl Logo" />
      <MobileNavigation pages={pages} logoAlt="Travl Logo" />
      <main>{children}</main>
      <Footer logoAlt="Travl" email="info@travl.ae" />
    </>
  );
}
