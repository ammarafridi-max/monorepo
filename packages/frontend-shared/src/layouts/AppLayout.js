import Navigation from '../components/shared/layout/Navigation';
import Footer from '../components/shared/layout/Footer';
import MobileNavigation from '../components/shared/layout/MobileNavigation';

export default function AppLayout({ children, pages = [], logoAlt = '', email = '', onDark = false }) {
  return (
    <>
      <Navigation pages={pages} logoAlt={logoAlt} onDark={onDark} />
      <MobileNavigation pages={pages} logoAlt={logoAlt} onDark={onDark} />
      <main>{children}</main>
      <Footer logoAlt={logoAlt} email={email} />
    </>
  );
}
