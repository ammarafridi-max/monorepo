'use client';
import AdminDummyTicketDetailPage from '@travel-suite/frontend-shared/pages/admin/AdminDummyTicketDetailPage';

const brand = {
  label: 'MyDummyTicket',
  website: 'www.MyDummyTicket.ae',
  websiteUrl: 'https://www.MyDummyTicket.ae',
};

export default function Page() {
  return <AdminDummyTicketDetailPage brand={brand} />;
}
