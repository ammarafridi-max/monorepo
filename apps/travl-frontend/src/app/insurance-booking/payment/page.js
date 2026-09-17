import Image from 'next/image';
import InsurancePaymentPage from '@travel-suite/frontend-shared/pages/client/InsurancePaymentPage';
import { DUMMY_TICKET_365, VISAWADI } from '@/config/partners';

export const metadata = {
  title: 'Booking Confirmed | Travl',
  description: 'Your travel insurance policy has been confirmed.',
};

const partnerIcon = (src, alt) => (
  <Image src={src} alt={alt} width={24} height={24} className="rounded-full" />
);

// Cross-sell after an insurance purchase: both referred out to partner brands.
const upsells = [
  {
    icon: partnerIcon(VISAWADI.icon, VISAWADI.name),
    title: 'Get Visa Assistance',
    brand: VISAWADI.name,
    description:
      'Schengen, UK, US and Saudi Arabia visas. VisaWadi prepares your file, books the appointment and tracks it to a decision.',
    priceCaption: 'from',
    price: VISAWADI.fromPrice,
    ctaLabel: 'Get assistance',
    href: VISAWADI.visaHubUrl,
    external: true,
  },
  {
    icon: partnerIcon(DUMMY_TICKET_365.icon, DUMMY_TICKET_365.name),
    title: 'Book a Dummy Ticket',
    brand: DUMMY_TICKET_365.name,
    description:
      'A verifiable flight reservation with a real PNR, accepted by embassies and visa centres as proof of onward travel.',
    priceCaption: 'from',
    price: DUMMY_TICKET_365.fromPrice,
    ctaLabel: 'Book now',
    href: DUMMY_TICKET_365.url,
    external: true,
  },
];

export default function PaymentPage() {
  return <InsurancePaymentPage upsells={upsells} />;
}
