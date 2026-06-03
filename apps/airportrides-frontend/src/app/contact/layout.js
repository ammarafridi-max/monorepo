import { SITE_URL } from '@/config';

export const metadata = {
  title: 'Contact Us – AirportRides',
  description:
    'Get in touch with AirportRides for booking help, transfer queries, or general support. We\'re available 24/7 by email and WhatsApp.',
  alternates: { canonical: `${SITE_URL}/contact` },
};

export default function ContactLayout({ children }) {
  return children;
}
