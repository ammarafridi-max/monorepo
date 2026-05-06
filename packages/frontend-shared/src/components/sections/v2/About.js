import Image from 'next/image';
import PrimarySection from '../../shared/layout/PrimarySection.js';
import Container from '../../shared/layout/Container.js';
import {
  MdOutlineAirplaneTicket,
  MdOutlineHealthAndSafety,
  MdOutlineHotel,
} from 'react-icons/md';

const defaultServices = [
  {
    icon: <MdOutlineAirplaneTicket />,
    title: 'Dummy Tickets',
    description:
      'Our dummy tickets are genuine flight reservations with a verifiable PNR. Issued in a format accepted by visa officers at VFS, BLS, and embassies worldwide.',
  },
  {
    icon: <MdOutlineHotel />,
    title: 'Hotel Reservations',
    description:
      'We provide hotel reservations on request, formatted to meet embassy requirements. Ready to submit with your visa application.',
  },
  {
    icon: <MdOutlineHealthAndSafety />,
    title: 'Travel Insurance',
    description:
      'Genuine travel insurance policies covering medical emergencies, trip cancellations, and more. Schengen-compliant plans issued and delivered instantly.',
  },
];

export default function About({
  title = 'About Us',
  text = 'Travl Technologies LLC is a licensed travel agency based in Dubai, UAE. We help residents across the UAE and GCC get the travel documents they need for visa applications, quickly and without hassle.',
  services = defaultServices,
}) {
  return (
    <PrimarySection className="py-16 md:py-20 bg-white" id="about">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10 lg:gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5">{title}</h2>
            <p className="text-gray-500 leading-relaxed mb-8">{text}</p>
            <div className="space-y-5">
              {services.map((service) => (
                <div key={service.title} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-600 text-white text-xl flex items-center justify-center shrink-0 mt-0.5">
                    {service.icon}
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    <span className="font-semibold text-gray-900">{service.title}: </span>
                    {service.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:grid grid-cols-2 gap-4 min-h-[480px]">
            <div className="relative rounded-2xl overflow-hidden bg-gray-100">
              <Image
                src="/happy-traveler1.webp"
                fill
                sizes="210px"
                className="object-cover object-center"
                alt="Happy couple with their approved visas"
              />
            </div>
            <div className="flex flex-col gap-4">
              <div className="relative rounded-2xl overflow-hidden bg-gray-100 h-[30%] p-4">
                <Image
                  src="/travel-icon.webp"
                  fill
                  sizes="210px"
                  className="object-contain object-center"
                  alt="Travel icon"
                />
              </div>
              <div className="relative rounded-2xl overflow-hidden bg-gray-100 flex-1">
                <Image
                  src="/happy-traveler2.webp"
                  fill
                  sizes="210px"
                  className="object-cover object-center"
                  alt="Happy couple with their flight reservations"
                />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </PrimarySection>
  );
}
