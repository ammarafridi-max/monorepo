'use client';
import AdminDummyTicketDetailPage from '@travel-suite/frontend-shared/pages/admin/AdminDummyTicketDetailPage';

const brand = {
  label: 'The Dummy Ticket',
  website: 'www.TheDummyTicket.ae',
  websiteUrl: 'https://www.TheDummyTicket.ae',
};

export default function Page() {
  return <AdminDummyTicketDetailPage brand={brand} />;
}
