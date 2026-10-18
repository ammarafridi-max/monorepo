'use client';
import { EMAIL, WHATSAPP_NUMBER } from '@/config/contact';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { usePathname } from 'next/navigation';
import { localeCurrency } from '@/lib/locales';
import { HelpCircle, Mail, Plane, Rss } from 'lucide-react';
import { CurrencyProvider } from '@travel-suite/frontend-shared/contexts/CurrencyContext';
import { TicketProvider } from '@travel-suite/frontend-shared/contexts/TicketContext';
import { InsuranceProvider } from '@travel-suite/frontend-shared/contexts/InsuranceContext';
import AppLayout from '@travel-suite/frontend-shared/layouts/AppLayout';
import AnalyticsInit from '@travel-suite/frontend-shared/components/shared/AnalyticsInit';
import StickyWhatsApp from '@travel-suite/frontend-shared/components/ui/v2/StickyWhatsApp';

const LIGHT_HEADER_ROUTES = [
  '/blog',
  '/booking',
  '/insurance-booking',
  '/faq',
  '/privacy-policy',
  '/terms-and-conditions',
];

const LOGO_ALT = 'DT365 Logo';
const LOGO_SRC = '/logo-icon.png';
const BRAND_NAME = 'Dummy Ticket 365';

const TICKET_COLUMNS = [
  {
    title: 'By Country',
    links: [
      { name: 'Dummy Ticket from India', short: 'India', link: '/in' },
      { name: 'Dummy Ticket from the UAE', short: 'United Arab Emirates', link: '/ae' },
      { name: 'Dummy Ticket from the UK', short: 'United Kingdom', link: '/uk' },
      { name: 'Dummy Ticket from Canada', short: 'Canada', link: '/ca' },
      { name: 'Dummy Ticket from Saudi Arabia', short: 'Saudi Arabia', link: '/sa' },
      { name: 'Dummy Ticket from Australia', short: 'Australia', link: '/au' },
      { name: 'Dummy Ticket from Singapore', short: 'Singapore', link: '/sg' },
      { name: 'Dummy Ticket from the Philippines', short: 'Philippines', link: '/ph' },
      { name: 'Dummy Ticket from Germany', short: 'Germany', link: '/de' },
      { name: 'Dummy Ticket from Indonesia', short: 'Indonesia', link: '/id' },
    ],
  },
  {
    title: 'By Visa Type',
    links: [
      { name: 'Schengen visa', link: '/dummy-ticket-schengen-visa' },
      { name: 'UK visa', link: '/dummy-ticket-uk-visa' },
      { name: 'Canada visa', link: '/dummy-ticket-canada-visa' },
      { name: 'Japan visa', link: '/dummy-ticket-japan-visa' },
      { name: 'Australia visa', link: '/dummy-ticket-australia-visa' },
    ],
  },
  {
    title: 'Ticket Options',
    links: [
      { name: 'For any visa', link: '/dummy-ticket-for-visa' },
      { name: 'Verifiable dummy ticket', link: '/verifiable-dummy-ticket' },
      { name: 'Multi city', link: '/multi-city-dummy-ticket' },
      { name: 'Valid for 14 days', link: '/dummy-ticket-14-days' },
      { name: 'Onward ticket', link: '/onward-ticket' },
    ],
  },
  {
    title: 'By Airline',
    links: [
      { name: 'Lufthansa', link: '/lufthansa-dummy-ticket' },
      { name: 'Turkish Airlines', link: '/turkish-airlines-dummy-ticket' },
      { name: 'Air France', link: '/air-france-dummy-ticket' },
      { name: 'Flight itinerary', link: '/flight-itinerary' },
    ],
  },
];

const defaultPages = [
  {
    name: 'Dummy Tickets',
    links: [
      '/',
      '/booking/select-flights',
      '/booking/review-details',
      ...TICKET_COLUMNS.flatMap((column) => column.links.map((item) => item.link)),
    ],
    icon: <Plane size={18} />,
    columns: TICKET_COLUMNS,
  },
  { name: 'Blog', links: ['/blog'], icon: <Rss size={18} /> },
  { name: 'FAQ', links: ['/faq'], icon: <HelpCircle size={18} /> },
  { name: 'Email Us', links: [`mailto:${EMAIL}`], icon: <Mail size={18} /> },
];

const footerLinkGroups = TICKET_COLUMNS.map(({ title, links }) => ({
  title,
  links: links.map(({ name, short, link }) => ({ label: short ?? name, href: link })),
}));

const flightItineraryPages = [
  {
    name: 'Flight Itinerary',
    links: ['/flight-itinerary', '/booking/select-flights', '/booking/review-details'],
    icon: <Plane size={18} />,
  },
  { name: 'Blog', links: ['/blog'], icon: <Rss size={18} /> },
  { name: 'Email Us', links: [`mailto:${EMAIL}`], icon: <Mail size={18} /> },
];

export default function Providers({ children }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');
  const defaultCurrency = localeCurrency(pathname);
  const headerOnDark = !LIGHT_HEADER_ROUTES.some((route) => pathname?.startsWith(route));
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

  if (pathname?.startsWith('/flight-itinerary')) {
    return (
      <>
        <AnalyticsInit />
        <Toaster />
        <QueryClientProvider client={queryClient}>
          <CurrencyProvider defaultCode={defaultCurrency}>
            <TicketProvider>
                <InsuranceProvider>
                  <AppLayout logoSrc={LOGO_SRC} brandName={BRAND_NAME} pages={flightItineraryPages} footerLinkGroups={footerLinkGroups} logoAlt={LOGO_ALT} email={EMAIL} onDark={headerOnDark}>
                    <main>{children}</main>
                  </AppLayout>
                  <StickyWhatsApp phoneNumber={WHATSAPP_NUMBER} />
                </InsuranceProvider>
            </TicketProvider>
          </CurrencyProvider>
        </QueryClientProvider>
      </>
    );
  }

  return (
    <>
      <AnalyticsInit />
      <Toaster />
      <QueryClientProvider client={queryClient}>
        <CurrencyProvider defaultCode={defaultCurrency}>
          <TicketProvider>
              <InsuranceProvider>
                <AppLayout logoSrc={LOGO_SRC} brandName={BRAND_NAME} pages={defaultPages} footerLinkGroups={footerLinkGroups} logoAlt={LOGO_ALT} email={EMAIL} onDark={headerOnDark}>
                  <main>{children}</main>
                </AppLayout>
                <StickyWhatsApp phoneNumber={WHATSAPP_NUMBER} />
              </InsuranceProvider>
          </TicketProvider>
        </CurrencyProvider>
      </QueryClientProvider>
    </>
  );
}
