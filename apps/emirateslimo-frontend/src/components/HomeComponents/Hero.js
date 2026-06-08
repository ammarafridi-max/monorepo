import Container from '../Container';
import PrimarySection from '../PrimarySection';
import PageHeading from '../PageHeading';
import LimoForm from '../LimoForm';

const trustItems = [
  { label: 'Professional Drivers' },
  { label: '24/7 Availability' },
  { label: 'Fixed Pricing' },
  { label: 'Free Cancellation' },
];

export default function Hero({
  title = 'Book Your Chauffeur',
  subtitle,
  text = 'Premium chauffeur service with professional drivers and seamless airport transfers across the UAE.',
}) {
  const eyebrow = subtitle || "UAE's Premium Chauffeur Service";

  return (
    <PrimarySection className="pt-10 lg:pt-14 pb-0">
      <Container>
        <div className="grid lg:grid-cols-[5.5fr_4.5fr] items-start gap-8 lg:gap-16">
          <div className="text-black">
            <div className="flex items-center gap-2 mb-4">
              <span className="h-px w-6 bg-accent-500" />
              <p className="text-[11px] tracking-[0.25em] font-light uppercase text-accent-600">{eyebrow}</p>
            </div>

            <PageHeading className="text-[34px] lg:text-[50px] leading-[1.15] font-light mb-4 tracking-tight">
              {title}
            </PageHeading>

            <p className="text-[16px] lg:text-[18px] font-light text-black/50 leading-[1.8] mb-8 max-w-lg">{text}</p>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              {trustItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-900 flex-shrink-0" />
                  <span className="text-[13px] font-light text-black/50 tracking-wide">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <LimoForm />
          </div>
        </div>
      </Container>
    </PrimarySection>
  );
}
