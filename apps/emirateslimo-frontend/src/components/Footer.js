import { FaStripe, FaGooglePay, FaApplePay } from 'react-icons/fa';
import { RiVisaLine, RiMastercardLine } from 'react-icons/ri';
import { FaFacebookF, FaInstagram } from 'react-icons/fa';
import Link from 'next/link';
import Container from './Container';

const paymentIcons = [<FaStripe />, <FaGooglePay />, <FaApplePay />, <RiVisaLine />, <RiMastercardLine />];

export default function Footer() {
  return (
    <footer className="bg-primary-900 text-white">
      <div className="h-px bg-gradient-to-r from-transparent via-accent-500/40 to-transparent" />

      <Container className="py-16 font-outfit">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 border-b border-white/8 pb-12">
          <div className="lg:col-span-4 space-y-5">
            <img src="/logo-dark.webp" alt="Emirates Limo" className="w-38" />
            <p className="text-white/45 text-[14px] leading-[1.85]">
              Premium airport transfers and chauffeur services across the UAE. Reliable, discreet, and always on time.
            </p>

            <div className="flex gap-3 pt-1">
              <SocialIcon icon={<FaFacebookF />} href="https://www.facebook.com/emirateslimo" />
              <SocialIcon icon={<FaInstagram />} href="https://www.instagram.com/emirateslimo" />
            </div>

            <div className="pt-3 space-y-2">
              <p className="text-[13px] font-light text-white/55 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-accent-500 flex-shrink-0" />
                <a href="tel:+971569964924" className="text-[13px] font-light text-white/55 hover:text-white/80 transition-colors duration-300">
                  +971 56 996 4924
                </a>
              </p>
              <p className="text-[13px] font-light text-white/55 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-accent-500 flex-shrink-0" />
                contact@emirateslimo.com
              </p>
              <p className="text-[13px] font-light text-white/55 flex items-start gap-2">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-accent-500 flex-shrink-0" />
                A Block, Abraj Al Mamzar, Dubai, UAE
              </p>
            </div>
          </div>

          <FooterColumn title="Company">
            <FooterLink to="/">Home</FooterLink>
            <FooterLink to="/about-us">About</FooterLink>
            <FooterLink to="/contact-us">Contact</FooterLink>
            <FooterLink to="/fleet">Fleet</FooterLink>
            <FooterLink to="/frequently-asked-questions">FAQs</FooterLink>
          </FooterColumn>

          <FooterColumn title="Services">
            <FooterLink to="/dubai-airport-transfer">Dubai Airport Transfer</FooterLink>
            <FooterLink to="/hourly-chauffeur">Hourly Chauffeur</FooterLink>
            <FooterLink to="/chauffeur-service">Chauffeur Service</FooterLink>
            <FooterLink to="/limo-service-dubai">Limo Service Dubai</FooterLink>
          </FooterColumn>

          <FooterColumn title="Transfers">
            <FooterLink to="/dubai-transfer">Dubai Transfer</FooterLink>
            <FooterLink to="/abu-dhabi-to-dubai-transfer">Abu Dhabi to Dubai</FooterLink>
            <FooterLink to="/dubai-to-abu-dhabi-transfer">Dubai to Abu Dhabi</FooterLink>
          </FooterColumn>
        </div>

        <div className="flex justify-center gap-5 py-6 border-b border-white/8">
          {paymentIcons.map((icon, i) => (
            <div key={i} className="text-white/25 text-[28px] hover:text-white/60 transition-colors duration-300">
              {icon}
            </div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 pt-6 text-white/35 text-[13px] font-light">
          <p>© {new Date().getFullYear()} TRAVL Technologies. All Rights Reserved.</p>
          <div className="flex gap-6">
            <Link href="/terms-and-conditions" className="hover:text-white/70 transition-colors duration-300">
              Terms & Conditions
            </Link>
            <Link href="/privacy-policy" className="hover:text-white/70 transition-colors duration-300">
              Privacy Policy
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}

function FooterColumn({ title, children }) {
  return (
    <div className="lg:col-span-2 space-y-4">
      <p className="text-white/80 text-[13px] font-light tracking-[0.12em] uppercase">{title}</p>
      <div className="flex flex-col gap-3 text-white/40 text-[14px] font-light">{children}</div>
    </div>
  );
}

function FooterLink({ to, children }) {
  return (
    <Link href={to} className="hover:text-white/75 transition-colors duration-300">
      {children}
    </Link>
  );
}

function SocialIcon({ icon, href }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="w-9 h-9 flex items-center justify-center rounded-full border border-white/10 text-white/40 hover:border-accent-500/50 hover:text-accent-400 transition-all duration-300"
    >
      {icon}
    </a>
  );
}
