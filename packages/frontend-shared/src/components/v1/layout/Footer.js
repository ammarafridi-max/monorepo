import Image from 'next/image';
import Link from 'next/link';
import {
  FaStripe,
  FaGooglePay,
  FaApplePay,
  FaCcVisa,
  FaCcMastercard,
  FaCircle,
} from 'react-icons/fa';
import Container from './Container';

export default function Footer({
  logoAlt = 'Travl',
  email = 'info@travl.ae',
  disclaimer = 'Disclaimer: This service provides a flight itinerary with booking details and a verifiable PNR. It is not a paid airline ticket.',
  copyrightName = 'TRAVL Technologies',
}) {
  return (
    <footer className="bg-[linear-gradient(155deg,#0b1220_0%,#0f172a_55%,#132134_100%)] text-gray-300 font-nunito">
      <Container className="py-10 md:py-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 pb-7 border-b border-white/10">
          <div className="max-w-lg">
            <Image
              src="/logo.webp"
              alt={logoAlt}
              width={160}
              height={48}
              className="w-40 h-auto object-contain brightness-0 invert"
            />
            <p className="mt-3 text-[14px] md:text-[15px] text-gray-400 leading-6">
              Genuine flight itineraries with verifiable PNR details, delivered instantly by email.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 md:gap-6">
            {icons.map((icon, i) => (
              <div
                key={i}
                className="text-gray-300 text-[32px] md:text-[36px] hover:text-white transition-colors duration-200"
              >
                {icon}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-2 text-[14px] text-gray-400">
          <FooterLink href="/blog">Blog</FooterLink>
          <FaCircle className="text-[5px]" />
          <FooterLink href="/terms-and-conditions">Terms & Conditions</FooterLink>
          <FaCircle className="text-[5px]" />
          <FooterLink href="/privacy-policy">Privacy Policy</FooterLink>
          <FaCircle className="hidden md:block text-[5px]" />
          <FooterLink href={`mailto:${email}`}>{email}</FooterLink>
        </div>

        <p className="text-sm mt-4 text-gray-400">{disclaimer}</p>

        <div className="mt-6 pt-5 border-t border-white/10 text-[13px] text-gray-500">
          © 2025 <span className="text-gray-200 font-medium">{copyrightName}</span>. All rights
          reserved.
        </div>
      </Container>
    </footer>
  );
}

function FooterLink({ href, children }) {
  const isInternal = href?.startsWith('/');

  if (isInternal) {
    return (
      <Link href={href} className="hover:text-white transition-colors duration-200 font-medium">
        {children}
      </Link>
    );
  }

  return (
    <a href={href} className="hover:text-white transition-colors duration-200 font-medium">
      {children}
    </a>
  );
}

const icons = [
  <FaStripe key="stripe" />,
  <FaGooglePay key="gpay" />,
  <FaApplePay key="applepay" />,
  <FaCcVisa key="visa" />,
  <FaCcMastercard key="mastercard" />,
];
