import Navigation from '../components/v1/layout/Navigation';
import Footer from '../components/v1/layout/Footer';
import MobileNavigation from '../components/v1/layout/MobileNavigation';

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
