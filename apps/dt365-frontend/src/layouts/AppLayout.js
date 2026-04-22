import Navigation from '@travel-suite/frontend-shared/components/v1/layout/Navigation';
import Footer from '@travel-suite/frontend-shared/components/v1/layout/Footer';
import MobileNavigation from '@travel-suite/frontend-shared/components/v1/layout/MobileNavigation';
import { Plane, Rss, Mail } from 'lucide-react';

export const defaultPages = [
  {
    name: 'Dummy Tickets',
    links: ['/', '/booking/select-flights', '/booking/review-details'],
    icon: <Plane size={18} />,
    subpages: [
      { name: 'Dummy Ticket For Schengen Visa', link: '/dummy-ticket-schengen-visa' },
      { name: 'Dummy Ticket For UK Visa', link: '/dummy-ticket-uk-visa' },
      { name: 'Onward Ticket', link: '/onward-ticket' },
      { name: 'Flight Itinerary', link: '/flight-itinerary' },
    ],
  },
  { name: 'Blog', links: ['/blog'], icon: <Rss size={18} /> },
  { name: 'Email Us', links: ['mailto:info@dummyticket365.com'], icon: <Mail size={18} /> },
];

export default function AppLayout({ children, pages = defaultPages }) {
  return (
    <>
      <Navigation pages={pages} logoAlt="DT365 Logo" />
      <MobileNavigation pages={pages} logoAlt="DT365 Logo" />
      <main>{children}</main>
      <Footer logoAlt="DT365" email="info@dummyticket365.com" />
    </>
  );
}
