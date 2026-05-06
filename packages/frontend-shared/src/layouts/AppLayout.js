import Navigation from '../components/shared/layout/Navigation';
import Footer from '../components/shared/layout/Footer';
import MobileNavigation from '../components/shared/layout/MobileNavigation';

export default function AppLayout({ children, pages = [], logoAlt = '', email = '' }) {
  return (
    <>
      <Navigation pages={pages} logoAlt={logoAlt} />
      <MobileNavigation pages={pages} logoAlt={logoAlt} />
      <main>{children}</main>
      <Footer logoAlt={logoAlt} email={email} />
    </>
  );
}
