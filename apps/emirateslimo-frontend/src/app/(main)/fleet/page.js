import { getVehicles } from '@/lib/vehicles';
import { buildGraph, buildMetadata, buildOrganization, buildWebPage, buildWebsite } from '@/lib/schema';
import PageHero from '@/components/Sections/PageHero';
import PrimarySection from '@/components/PrimarySection';
import Container from '@/components/Container';
import PrimaryLink from '@/components/PrimaryLink';
import FleetGrid from './FleetGrid';

export const pageData = {
  meta: {
    title: 'Luxury Fleet | Chauffeur Service Cars | Emirates Limo',
    description:
      'Explore our luxury fleet including Lexus, GMC Yukon, Mercedes V-Class, BMW 7-Series, and more. Perfect for airport transfers and chauffeur service.',
    canonical: 'https://www.emirateslimo.com/fleet',
  },
  breadcrumbPaths: [
    { label: 'Home', href: '/' },
    { label: 'Fleet', href: '/fleet' },
  ],
  hero: { title: 'Our Luxury Fleet', subtitle: 'Sedans, SUVs & Executive Vans' },
  ctas: [
    { href: '/dubai-airport-transfer', label: 'Book Airport Transfer' },
    { href: '/hourly-chauffeur', label: 'Book Hourly Chauffeur' },
  ],
};

export const metadata = buildMetadata(pageData.meta);

export const revalidate = 300;

export default async function Page() {
  const vehicles = await getVehicles().catch(() => []);

  const graph = buildGraph([
    buildOrganization(),
    buildWebsite(),
    buildWebPage(pageData.meta),
    ...vehicles.map((vehicle) => ({
      '@type': 'Car',
      '@id': `${pageData.meta.canonical}#${vehicle._id}`,
      name: `${vehicle.brand} ${vehicle.model}`,
      brand: { '@type': 'Brand', name: vehicle.brand },
      model: vehicle.model,
      ...(vehicle.year ? { vehicleModelDate: String(vehicle.year) } : {}),
      ...(vehicle.type ? { bodyType: vehicle.type } : {}),
      ...(vehicle.passengers ? { seatingCapacity: vehicle.passengers } : {}),
      ...(vehicle.featuredImage ? { image: vehicle.featuredImage } : {}),
    })),
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />
      <PageHero paths={pageData.breadcrumbPaths} title={pageData.hero.title} subtitle={pageData.hero.subtitle} />

      <PrimarySection className="py-15 lg:py-20">
        <Container>
          {vehicles.length > 0 ? (
            <FleetGrid vehicles={vehicles} />
          ) : (
            <p className="text-center text-gray-500 font-light py-10">
              No vehicles available at the moment. Please check back soon.
            </p>
          )}

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            {pageData.ctas.map((cta) => (
              <PrimaryLink key={cta.href} href={cta.href}>
                {cta.label}
              </PrimaryLink>
            ))}
          </div>
        </Container>
      </PrimarySection>
    </>
  );
}
