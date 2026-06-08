import PrimarySection from '../PrimarySection';
import Container from '../Container';
import SectionTitle from '../SectionTitle';
import { LuArrowRight } from 'react-icons/lu';

const steps = [
  {
    title: 'Pickup & Dropoff',
    text: 'Enter your pickup and dropoff addresses, select your pickup date and time, and then click Search.',
  },
  {
    title: 'Choose Your Limo',
    text: 'Select from a variety of luxury, comfortable limousines that best fit your needs and requirements.',
  },
  {
    title: 'Enter Your Information',
    text: 'Provide essential details like your name, flight number, and contact info so we can keep you updated.',
  },
  {
    title: 'Secure Payment',
    text: 'Complete your payment safely to confirm your booking and enjoy a seamless travel experience.',
  },
];

export default function Process({ title = 'Book Your Ride in 4 Easy Steps', subtitle = 'Our Process' }) {
  return (
    <PrimarySection id="process" className="bg-primary-900 py-15 lg:py-30">
      <Container>
        <SectionTitle dark textAlign="center" subtitle={subtitle}>
          {title}
        </SectionTitle>

        <div className="mt-10 lg:mt-14 grid grid-cols-1 gap-4 lg:grid-cols-4">
          {steps.map((step, i) => (
            <div
              key={i}
              className="group relative rounded-2xl border border-white/8 bg-white/4 p-7 transition-all duration-400 hover:border-accent-500/40 hover:bg-white/7"
            >
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-accent-500/40 text-accent-400 text-sm font-light font-outfit group-hover:border-accent-500 group-hover:text-accent-400 transition-colors duration-300 flex-shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div className="h-px flex-1 bg-white/8 group-hover:bg-accent-500/25 transition-colors duration-300" />
              </div>

              <h3 className="mb-2.5 text-[17px] font-light tracking-wide text-white/85 group-hover:text-white transition-colors duration-300">
                {step.title}
              </h3>

              <p className="text-[14px] font-extralight leading-relaxed text-white/40">{step.text}</p>

              <LuArrowRight className="absolute bottom-6 right-6 text-white/15 transition-all duration-300 group-hover:text-white group-hover:translate-x-1" />
            </div>
          ))}
        </div>
      </Container>
    </PrimarySection>
  );
}
