'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { usePathname } from 'next/navigation';
import {
  Mail, Plane, ShieldPlus, Globe,
  CalendarDays, HeartPulse, Stethoscope, MapPin, Users,
} from 'lucide-react';
import { UserAuthContext } from '@travel-suite/frontend-shared/contexts/AuthContextBase';
import { CurrencyProvider } from '@travel-suite/frontend-shared/contexts/CurrencyContext';
import { InsuranceProvider } from '@travel-suite/frontend-shared/contexts/InsuranceContext';
import AppMegaLayout from '@travel-suite/frontend-shared/layouts/AppMegaLayout';
import { UserAuthProvider } from '@travel-suite/frontend-shared/contexts/UserAuthProvider';
import Footer from '@travel-suite/frontend-shared/components/sections/v2/Footer';
import StickyWhatsApp from '@travel-suite/frontend-shared/components/ui/v2/StickyWhatsApp';
import AnalyticsInit from '@travel-suite/frontend-shared/components/shared/AnalyticsInit';
import HotjarInit from '@travel-suite/frontend-shared/components/shared/HotjarInit';

const LOGO_ALT = 'Travl';
const EMAIL = 'info@travl.ae';
const WHATSAPP_NUMBER = '+971569964924';

const travlFooter = (
  <Footer
    brand="Travl"
    logoSrc="/logo.webp"
    logoAlt="Travl"
    description="Travel documentation and insurance services for UAE residents since 2018."
    copyright={`© ${new Date().getFullYear()} Travl Technologies LLC. All rights reserved.`}
    columns={[
      {
        heading: 'Travel Insurance',
        links: [
          { label: 'All Plans', href: '/travel-insurance' },
          { label: 'Schengen Visa', href: '/travel-insurance/schengen-visa' },
          { label: 'Annual Travel Insurance', href: '/travel-insurance/annual' },
          { label: 'Family Travel Insurance', href: '/travel-insurance/family' },
          { label: 'Annual Multi-Trip', href: '/travel-insurance/annual-multi-trip' },
          { label: 'Single Trip', href: '/travel-insurance/single-trip' },
          { label: 'Travel Medical', href: '/travel-insurance/medical' },
          { label: 'International', href: '/travel-insurance/international' },
        ],
      },
      {
        heading: 'Visa Services',
        links: [
          { label: 'Travel Itinerary', href: '/travel-itinerary' },
          { label: 'All Destinations', href: '/visa' },
          { label: 'Schengen Visa', href: '/visa/schengen' },
          { label: 'United Kingdom', href: '/visa/united-kingdom' },
          { label: 'United States', href: '/visa/usa' },
          { label: 'Canada', href: '/visa/canada' },
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
            { Icon: Plane,         label: 'Annual Travel Insurance', desc: 'One policy covering every trip for a year',    href: '/travel-insurance/annual' },
            { Icon: Users,         label: 'Family Travel Insurance', desc: 'One policy covering the whole family',         href: '/travel-insurance/family' },
            { Icon: CalendarDays,  label: 'Annual Multi-Trip',      desc: 'One policy covering all trips for 12 months',   href: '/travel-insurance/annual-multi-trip' },
            { Icon: HeartPulse,    label: 'Single Trip',            desc: 'Pay only for the days you travel',              href: '/travel-insurance/single-trip' },
            { Icon: Stethoscope,   label: 'Travel Medical',         desc: 'Emergency treatment & hospitalisation cover',   href: '/travel-insurance/medical' },
            { Icon: Globe,         label: 'International',          desc: 'Worldwide coverage from EUR 80,000',            href: '/travel-insurance/international' },
          ],
        },
        {
          heading: 'By Country',
          items: [
            { flag: 'eu', label: 'Schengen Visa',     desc: 'EUR 30,000 cover, VFS & BLS accepted',           href: '/travel-insurance/schengen-visa' },
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
          ],
        },
      ],
    },
  },
  {
    name: 'Travel Itinerary',
    links: ['/travel-itinerary'],
  },
  {
    name: 'Visa Assistance',
    links: ['/visa'],
    mega: {
      columns: [
        {
          heading: 'By Destination',
          items: [
            { Icon: Globe,   label: 'All Destinations',    desc: 'Browse all visa services we offer',                  href: '/visa' },
            { flag: 'eu',    label: 'Schengen Visa',       desc: 'Access 29 European countries with one visa',         href: '/visa/schengen' },
            { flag: 'gb',    label: 'United Kingdom',      desc: 'Tourism, business, and family visits to the UK',     href: '/visa/united-kingdom' },
            { flag: 'us',    label: 'United States',       desc: 'B1/B2 visitor visa with interview coaching',         href: '/visa/usa' },
            { flag: 'ca',    label: 'Canada',              desc: 'Temporary resident visa for tourism and family',     href: '/visa/canada' },
          ],
        },
      ],
    },
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
  // Real customer auth only on the /apply visa-application routes; every other
  // public page keeps the guest provider (unchanged behaviour).
  const isApplyRoute = pathname?.startsWith('/apply');
  const AuthProvider = isApplyRoute ? UserAuthProvider : GuestAuthProvider;
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
      <HotjarInit />
      <Toaster />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CurrencyProvider>
            <InsuranceProvider maxStartDays={270}>
              <AppMegaLayout pages={defaultPages} logoAlt={LOGO_ALT} footer={travlFooter}>
                <main>{children}</main>
              </AppMegaLayout>
              <StickyWhatsApp
                phoneNumber={WHATSAPP_NUMBER}
                hidePathPrefixes={['/insurance-booking', '/apply']}
              />
            </InsuranceProvider>
          </CurrencyProvider>
        </AuthProvider>
      </QueryClientProvider>
    </>
  );
}
