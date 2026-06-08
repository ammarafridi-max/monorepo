import PageHero from '@/components/Sections/PageHero';
import FleetClient from './FleetClient';

export const metadata = {
  title: 'Luxury Fleet | Chauffeur Service Cars | Emirates Limo',
  description:
    'Explore our luxury fleet including Lexus, GMC Yukon, Mercedes V-Class, BMW 7-Series, and more. Perfect for airport transfers and chauffeur service.',
  alternates: { canonical: 'https://www.emirateslimo.com/fleet' },
  robots: { index: true, follow: true },
};

export default function FleetPage() {
  return (
    <>
      <PageHero
        paths={[
          { label: 'Home', href: '/' },
          { label: 'Fleet', href: '/fleet' },
        ]}
        title="Our Luxury Fleet"
        subtitle="Sedans, SUVs & Executive Vans"
      />
      <FleetClient />
    </>
  );
}
