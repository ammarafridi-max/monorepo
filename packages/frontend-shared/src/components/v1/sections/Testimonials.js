import Container from '../layout/Container';
import PrimarySection from '../layout/PrimarySection';
import TestimonialCard from '../cards/TestimonialCard';
import SectionTitle from '../layout/SectionTitle';

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
        <div className="flex gap-5 overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-3 md:gap-7">
          {testimonials.map((test, i) => (
            <TestimonialCard
              key={i}
              title={test.title}
              name={test.name}
              src={test.img}
              purpose={test.purpose}
            >
              {test.text}
            </TestimonialCard>
          ))}
        </div>
      </Container>
    </PrimarySection>
  );
}
