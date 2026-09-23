'use client';
import TicketSelectFlightsPage from '@travel-suite/frontend-shared/pages/client/TicketSelectFlightsPage';
import { EMAIL } from '@/config/contact';

export default function Page() {
  return <TicketSelectFlightsPage supportEmail={EMAIL} />;
}
