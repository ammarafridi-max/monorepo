import Navbar from '../components/sections/v2/Navbar';
import Footer from '../components/sections/v2/Footer';

export default function AppMegaLayout({ children, pages = [], logoAlt = 'Logo' }) {
  return (
    <>
      <Navbar pages={pages} logoAlt={logoAlt} />
      {children}
      <Footer />
    </>
  );
}
