import { getVehicles } from '@/lib/vehicles';
import PrimarySection from '../PrimarySection';
import Container from '../Container';
import SectionTitle from '../SectionTitle';
import PrimaryLink from '../PrimaryLink';
import FleetSlider from './FleetSlider';

export default async function Fleet({ title = 'Luxury Vehicles To Choose From', subtitle = 'Our Fleet' }) {
  const vehicles = await getVehicles().catch(() => []);
  if (vehicles.length === 0) return null;

  return (
    <PrimarySection className="py-15 lg:py-30">
      <Container>
        <SectionTitle subtitle={subtitle}>{title}</SectionTitle>
        <FleetSlider vehicles={vehicles} />
        <div className="mt-10 flex items-center justify-center">
          <PrimaryLink to="/fleet">View Full Fleet</PrimaryLink>
        </div>
      </Container>
    </PrimarySection>
  );
}
