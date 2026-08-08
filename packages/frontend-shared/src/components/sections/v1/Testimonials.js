import Container from '../../shared/layout/Container';
import PrimarySection from '../../shared/layout/PrimarySection';
import TestimonialCard from '../../cards/TestimonialCard';
import SectionTitle from '../../shared/layout/SectionTitle';

export default function Testimonials({
  title = 'Testimonials',
  subtitle = 'What our customers say about us',
  testimonials,
}) {
  return (
    <PrimarySection className="py-14 md:py-18 lg:py-24">
      <Container>
        <SectionTitle textAlign="center" subtitle={subtitle} className="mb-10 md:mb-12">
          {title}
        </SectionTitle>
        {/* Mobile is a snap carousel. The card no longer carries its own
            min-width, so the sizing lives on the wrapper here. */}
        <div className="flex gap-5 overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-3 md:gap-7 md:overflow-visible">
          {testimonials.map((test, i) => (
            <div key={i} className="min-w-[85%] snap-center md:min-w-0">
              <TestimonialCard
                quote={test.quote}
                name={test.name}
                location={test.location}
                stars={test.stars}
                plan={test.plan}
              />
            </div>
          ))}
        </div>
      </Container>
    </PrimarySection>
  );
}
