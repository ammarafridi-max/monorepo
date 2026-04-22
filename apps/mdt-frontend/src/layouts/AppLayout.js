import Navigation from '@travel-suite/frontend-shared/components/v1/layout/Navigation';
import Footer from '@travel-suite/frontend-shared/components/v1/layout/Footer';
import MobileNavigation from '@travel-suite/frontend-shared/components/v1/layout/MobileNavigation';
import { Plane, ShieldPlus, Rss, Mail } from 'lucide-react';

export const defaultPages = [
  {
    name: 'Dummy Tickets',
    links: ['/', '/booking/select-flights', '/booking/review-details'],
    icon: <Plane size={18} />,
    subpages: [
      { name: 'Dummy Ticket For Schengen Visa', link: '/dummy-ticket-schengen-visa' },
      { name: 'Dummy Ticket For US Visa', link: '/dummy-ticket-us-visa' },
      { name: 'Emirates Dummy Ticket', link: '/emirates-dummy-ticket' },
      { name: 'Etihad Dummy Ticket', link: '/etihad-dummy-ticket' },
      { name: 'Onward Ticket', link: '/onward-ticket' },
      { name: 'Flight Itinerary', link: '/flight-itinerary' },
    ],
  },
  {
    name: 'Travel Insurance',
    links: ['/travel-insurance', '/schengen-travel-insurance'],
    icon: <ShieldPlus size={18} />,
    subpages: [
      { name: 'Travel Insurance for Schengen Visa', link: '/schengen-travel-insurance' },
    ],
  },
  { name: 'Blog', links: ['/blog'], icon: <Rss size={18} /> },
  { name: 'Email Us', links: ['mailto:info@mydummyticket.ae'], icon: <Mail size={18} /> },
];

export default function AppLayout({ children, pages = defaultPages }) {
  return (
    <>
      <Navigation pages={pages} logoAlt="MDT Logo" />
      <MobileNavigation pages={pages} logoAlt="MDT Logo" />
      <main>{children}</main>
      <Footer logoAlt="MDT" email="info@mydummyticket.ae" />
    </>
  );
}
