import {
  MdOutlineAirplaneTicket,
  MdOutlineHealthAndSafety,
  MdOutlineHotel,
} from 'react-icons/md';
import Image from 'next/image';
import PrimarySection from '../PrimarySection';
import Container from '../layout/Container';
import SectionTitle from '../layout/SectionTitle';

export default function About({
  title = 'About Us',
  text = 'Travl Technologies LLC is a licensed travel agency based in Dubai, UAE. We help residents across the UAE and GCC get the travel documents they need for visa applications, quickly and without hassle. Our documentation is accepted by VFS, BLS, and embassies worldwide.',
}) {
  return (
    <PrimarySection className="py-14 md:py-10 lg:py-10" id="about">
      <Container className="flex flex-col lg:grid lg:grid-cols-[7fr_5fr] lg:items-center gap-8 lg:gap-12">
        <div className="w-full">
          <SectionTitle className="mb-7">{title}</SectionTitle>
          <p className="text-[16px] text-gray-600 font-light leading-7">
            {text}
          </p>
          <IconWithText
            icon={<MdOutlineAirplaneTicket />}
            title="Dummy Tickets"
            description="Our dummy tickets are genuine flight reservations with a verifiable PNR. Issued in a format accepted by visa officers at VFS, BLS, and embassies, so you can show proof of travel intent without buying a real ticket."
          />
          <IconWithText
            icon={<MdOutlineHotel />}
            title="Hotel Reservations"
            description="We provide hotel reservations on request, formatted to meet embassy requirements. If your visa application needs proof of accommodation, we can have it ready for you quickly."
          />
          <IconWithText
            icon={<MdOutlineHealthAndSafety />}
            title="Travel Insurance"
            description="We offer genuine travel insurance policies covering medical emergencies, trip cancellations, and more. Our Schengen-compliant plans meet the required medical coverage threshold and are issued and delivered instantly."
          />
        </div>
        <Gallery />
      </Container>
    </PrimarySection>
  );
}

function Gallery() {
  return (
    <div className="w-full min-h-[380px] lg:min-h-[540px] grid grid-cols-2 gap-4 lg:p-0">
      <div className="flex flex-col gap-3.75">
        <div className="relative bg-gray-100 rounded-2xl h-[100%] overflow-hidden">
          <Image
            src="/happy-traveler1.webp"
            fill
            sizes="(max-width: 1024px) 50vw, 25vw"
            className="object-cover object-center"
            alt="Happy couple with their approved visas"
          />
        </div>
      </div>
      <div className="flex flex-col gap-3.75">
        <div className="relative bg-gray-100 rounded-2xl h-[25%] overflow-hidden p-5.5">
          <Image
            src="/travel-icon.webp"
            fill
            sizes="(max-width: 1024px) 50vw, 25vw"
            className="object-contain object-center"
            alt="Travel icon"
          />
        </div>
        <div className="relative bg-gray-100 rounded-2xl h-[75%] overflow-hidden">
          <Image
            src="/happy-traveler2.webp"
            fill
            sizes="(max-width: 1024px) 50vw, 25vw"
            className="object-cover object-center"
            alt="A happy couple with their flight reservations"
          />
        </div>
      </div>
    </div>
  );
}

const IconWithText = ({ icon, title, description }) => (
  <div className="grid grid-cols-[auto_1fr] gap-4 items-center mt-6 rounded-2xl bg-white">
    <div className="w-[40px] h-[40px] text-xl rounded-xl bg-primary-500 text-white flex items-center justify-center">
      {icon}
    </div>
    <p className="text-[16px] text-gray-600 font-light leading-7">
      <span className="font-medium text-gray-900">{title}: </span>
      {description}
    </p>
  </div>
);

function Stat({ text, label }) {
  return (
    <div className="rounded-2xl border border-primary-100 bg-primary-50/50 px-4 py-3">
      <p className="text-[20px] font-semibold text-primary-700 leading-none">
        {text}
      </p>
      <p className="mt-1 text-[13px] text-gray-600">{label}</p>
    </div>
  );
}
