import Navbar from '../components/sections/v2/Navbar';
import Footer from '../components/sections/v2/Footer';

export default function AppMegaLayout({ children, pages = [], logoAlt = 'Logo', footer, loginHref, signupHref }) {
  return (
    <>
      <Navbar pages={pages} logoAlt={logoAlt} loginHref={loginHref} signupHref={signupHref} />
      <div className="h-[45px] lg:h-[53px] shrink-0" aria-hidden="true" />
      {children}
      {footer ?? <Footer />}
    </>
  );
}
