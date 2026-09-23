import Navigation from '../components/shared/layout/Navigation';
import Footer from '../components/shared/layout/Footer';
import MobileNavigation from '../components/shared/layout/MobileNavigation';

export default function AppLayout({
  children,
  pages = [],
  logoAlt = '',
  email = '',
  onDark = false,
  copyrightName,
  logoSrc,
  logoSrcOnDark,
  brandName,
}) {
  return (
    <>
      <Navigation pages={pages} logoAlt={logoAlt} onDark={onDark} logoSrc={logoSrc} logoSrcOnDark={logoSrcOnDark} brandName={brandName} />
      <MobileNavigation pages={pages} logoAlt={logoAlt} onDark={onDark} logoSrc={logoSrc} logoSrcOnDark={logoSrcOnDark} brandName={brandName} />
      <main>{children}</main>
      <Footer logoAlt={logoAlt} email={email} copyrightName={copyrightName} logoSrc={logoSrc} brandName={brandName} />
    </>
  );
}
