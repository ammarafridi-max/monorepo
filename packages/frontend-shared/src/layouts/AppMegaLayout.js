import MegaNavigation from '../components/v1/layout/MegaNavigation';
import MegaMobileNavigation from '../components/v1/layout/MegaMobileNavigation';
import Footer from '../components/v1/layout/Footer';

export default function AppMegaLayout({ children, pages = [], logoAlt = '', email = '' }) {
  return (
    <>
      <MegaNavigation pages={pages} logoAlt={logoAlt} />
      <MegaMobileNavigation pages={pages} logoAlt={logoAlt} />
      <main>{children}</main>
      <Footer logoAlt={logoAlt} email={email} />
    </>
  );
}
