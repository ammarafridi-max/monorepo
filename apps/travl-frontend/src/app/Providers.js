'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { usePathname } from 'next/navigation';
import {
  Mail, ShieldPlus, Globe,
  CalendarDays, HeartPulse, Stethoscope, MapPin, Users,
} from 'lucide-react';
import { UserAuthContext } from '@travel-suite/frontend-shared/contexts/AuthContextBase';
import { InsuranceProvider } from '@travel-suite/frontend-shared/contexts/InsuranceContext';
import { TicketProvider } from '@travel-suite/frontend-shared/contexts/TicketContext';
import AppMegaLayout from '@travel-suite/frontend-shared/layouts/AppMegaLayout';
import Footer from '@travel-suite/frontend-shared/components/sections/v2/Footer';
import StickyWhatsApp from '@travel-suite/frontend-shared/components/ui/v2/StickyWhatsApp';
import AnalyticsInit from '@travel-suite/frontend-shared/components/shared/AnalyticsInit';
import { EMAIL, WHATSAPP_NUMBER, ADDRESS, GMB_URL, SOCIALS } from '@/config/contact';

const LOGO_ALT = 'Travl';

const travlFooter = (
  <Footer
    brand="Travl"
    logoSrc="/logo.webp"
    logoAlt="Travl"
    description="AXA-issued travel insurance for UAE residents, from AED 30, delivered by email in minutes."
    copyright={`© ${new Date().getFullYear()} Travl Technologies. All rights reserved.`}
    socials={SOCIALS}
    address={ADDRESS}
    addressHref={GMB_URL}
    columns={[
      {
        heading: 'Travel Insurance',
        links: [
          { label: 'All Plans', href: '/travel-insurance' },
          { label: 'Schengen Visa', href: '/travel-insurance/schengen-visa' },
          { label: 'Single Trip', href: '/travel-insurance/single-trip' },
          { label: 'Annual Multi-Trip', href: '/travel-insurance/annual-multi-trip' },
          { label: 'Family Travel Insurance', href: '/travel-insurance/family' },
          { label: 'Travel Medical', href: '/travel-insurance/medical' },
          { label: 'International', href: '/travel-insurance/international' },
          { label: 'Bali & Indonesia', href: '/travel-insurance/indonesia' },
        ],
      },
      {
        heading: 'Insurance by Visa',
        links: [
          { label: 'UK Visa', href: '/travel-insurance/uk-visa' },
          { label: 'US Visa', href: '/travel-insurance/us-visa' },
          { label: 'Canada Visa', href: '/travel-insurance/canada-visa' },
          { label: 'Australia Visa', href: '/travel-insurance/australia-visa' },
          { label: 'France Visa', href: '/travel-insurance/france-visa' },
          { label: 'Italy Visa', href: '/travel-insurance/italy-visa' },
          { label: 'Spain Visa', href: '/travel-insurance/spain-visa' },
          { label: 'Germany Visa', href: '/travel-insurance/germany-visa' },
        ],
      },
      {
        heading: 'Other Services',
        links: [
          { label: 'Travel Itinerary', href: '/travel-itinerary' },
        ],
      },
      {
        heading: 'Company',
        links: [
          { label: 'About Us', href: '/about' },
          { label: 'Blog', href: '/blog' },
          { label: 'Make a Claim', href: '/claims' },
          { label: 'Contact Us', href: '/contact' },
          { label: 'Privacy Policy', href: '/privacy-policy' },
          { label: 'Terms & Conditions', href: '/terms-and-conditions' },
        ],
      },
    ]}
  />
);

const defaultPages = [
  {
    name: 'Travel Insurance',
    links: ['/travel-insurance'],
    mega: {
      layout: 'tabs',
      columns: [
        {
          heading: 'By Trip Type',
          items: [
            { Icon: ShieldPlus,    label: 'All Plans',              desc: 'Browse every insurance plan we offer',          href: '/travel-insurance' },
            { Icon: Users,         label: 'Family',                 desc: 'One policy covering the whole family',         href: '/travel-insurance/family' },
            { Icon: CalendarDays,  label: 'Annual Multi-Trip',      desc: 'One policy covering all trips for 12 months',   href: '/travel-insurance/annual-multi-trip' },
            { Icon: HeartPulse,    label: 'Single Trip',            desc: 'Pay only for the days you travel',              href: '/travel-insurance/single-trip' },
            { Icon: Stethoscope,   label: 'Travel Medical',         desc: 'Emergency treatment & hospitalisation cover',   href: '/travel-insurance/medical' },
            { Icon: Globe,         label: 'International',          desc: 'Worldwide coverage from EUR 80,000',            href: '/travel-insurance/international' },
          ],
        },
        {
          heading: 'By Country',
          items: [
            { flag: 'european_union', label: 'Schengen Visa', desc: 'EUR 30,000 cover, VFS & BLS accepted',    href: '/travel-insurance/schengen-visa' },
            { flag: 'fr', label: 'France Visa',       desc: 'Schengen cover accepted by VFS Global France',   href: '/travel-insurance/france-visa' },
            { flag: 'es', label: 'Spain Visa',        desc: 'Schengen cover accepted by BLS Spain',           href: '/travel-insurance/spain-visa' },
            { flag: 'it', label: 'Italy Visa',        desc: 'Schengen cover accepted by VFS Global Italy',    href: '/travel-insurance/italy-visa' },
            { flag: 'de', label: 'Germany Visa',      desc: 'Schengen cover accepted by VFS Global Germany',  href: '/travel-insurance/germany-visa' },
            { flag: 'gr', label: 'Greece Visa',       desc: 'Schengen cover accepted by VFS Global Greece',   href: '/travel-insurance/greece-visa' },
            { flag: 'ch', label: 'Switzerland Visa',  desc: 'Schengen cover accepted by VFS Global Switzerland', href: '/travel-insurance/switzerland-visa' },
            { flag: 'nl', label: 'Netherlands Visa',  desc: 'Schengen cover accepted by VFS Global Netherlands', href: '/travel-insurance/netherlands-visa' },
            { flag: 'at', label: 'Austria Visa',      desc: 'Schengen cover accepted by VFS Global Austria',  href: '/travel-insurance/austria-visa' },
            { flag: 'gb', label: 'UK Visa',           desc: 'Cover that meets UK visa requirements',          href: '/travel-insurance/uk-visa' },
            { flag: 'us', label: 'US Visa',           desc: 'Cover for B1/B2 and other US visa applications', href: '/travel-insurance/us-visa' },
            { flag: 'ca', label: 'Canada Visa',       desc: 'Cover accepted for Canadian visa submissions',   href: '/travel-insurance/canada-visa' },
            { flag: 'au', label: 'Australia Visa',    desc: 'Cover for Australian visitor visa applications', href: '/travel-insurance/australia-visa' },
            { flag: 'id', label: 'Bali & Indonesia',  desc: 'Medical, baggage and trip cover for Indonesia',  href: '/travel-insurance/indonesia' },
          ],
        },
      ],
    },
  },
  {
    name: 'Travel Itinerary',
    links: ['/travel-itinerary'],
  },
  { name: 'Email Us', links: [`mailto:${EMAIL}`] },
];

const GUEST_AUTH = { user: null, isAuthenticated: false, isLoadingAuth: false, setUser: () => {}, refreshUser: async () => {} };

function GuestAuthProvider({ children }) {
  return <UserAuthContext.Provider value={GUEST_AUTH}>{children}</UserAuthContext.Provider>;
}

export default function Providers({ children }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');
  // Travl has no customer accounts since /apply moved to VisaWadi, so every
  // public route is a guest route.
  const AuthProvider = GuestAuthProvider;
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 300 * 1000,
          },
        },
      }),
  );

  if (isAdminRoute) {
    return (
      <>
        <Toaster />
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </>
    );
  }

  return (
    <>
      <AnalyticsInit />
      <Toaster />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
            <TicketProvider>
            <InsuranceProvider maxStartDays={270}>
              <AppMegaLayout
                pages={defaultPages}
                logoAlt={LOGO_ALT}
                footer={travlFooter}
                loginHref={null}
                signupHref={null}
                cta={{ label: 'Get a Quote', href: '/insurance-booking/quote' }}
              >
                <main>{children}</main>
              </AppMegaLayout>
              <StickyWhatsApp
                phoneNumber={WHATSAPP_NUMBER}
                hidePathPrefixes={['/insurance-booking', '/apply']}
              />
            </InsuranceProvider>
            </TicketProvider>
        </AuthProvider>
      </QueryClientProvider>
    </>
  );
}
