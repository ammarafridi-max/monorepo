import { services } from '../../data/services';
import PrimarySection from '../PrimarySection';
import Container from '../Container';
import SectionTitle from '../SectionTitle';
import ServiceCard from '../ServiceCard';

export default function Services({ title = 'Premium Chauffeur Experiences in Dubai', subtitle = 'Our Services' }) {
  return (
    <PrimarySection id="services" className="py-15 lg:py-30">
      <Container>
        <SectionTitle textAlign="center" subtitle={subtitle} className="text-center">
          {title}
        </SectionTitle>

        <div className="mt-14 flex gap-10 overflow-x-auto lg:grid lg:grid-cols-3 lg:overflow-visible">
          {services.map((service, i) => (
            <ServiceCard href={service.href} text={service.text} title={service.title} image={service.image} key={i} />
          ))}
        </div>
      </Container>
    </PrimarySection>
  );
}
