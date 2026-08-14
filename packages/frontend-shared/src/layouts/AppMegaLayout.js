import Navbar from '../components/sections/v2/Navbar';
import Footer from '../components/sections/v2/Footer';

export default function AppMegaLayout({
  children,
  pages = [],
  logoSrc,
  logoWidth,
  logoHeight,
  logoAlt = 'Logo',
  footer,
  loginHref,
  signupHref,
  showCurrency = true,
}) {
  return (
    <>
      <Navbar
        pages={pages}
        logoSrc={logoSrc}
        logoWidth={logoWidth}
        logoHeight={logoHeight}
        logoAlt={logoAlt}
        loginHref={loginHref}
        signupHref={signupHref}
        showCurrency={showCurrency}
      />
      <div className="h-[45px] lg:h-[53px] shrink-0" aria-hidden="true" />
      {children}
      {footer ?? <Footer />}
    </>
  );
}
