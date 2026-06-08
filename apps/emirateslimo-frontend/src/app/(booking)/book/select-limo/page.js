import { Suspense } from 'react';
import VehicleLoadingCard from '@/components/VehicleLoadingCard';
import SelectLimoClient from './SelectLimoClient';

export const metadata = {
  title: 'Book a Limo | Emirates Limo Dubai',
  description: 'Book your luxury chauffeur or airport transfer in Dubai. Select your vehicle and confirm your journey with Emirates Limo.',
  robots: 'noindex, nofollow',
  alternates: {
    canonical: 'https://www.emirateslimo.com/book/select-limo',
  },
};

function LoadingFallback() {
  return (
    <>
      <div className="flex flex-col gap-3">
        <VehicleLoadingCard />
        <VehicleLoadingCard />
        <VehicleLoadingCard />
      </div>
      <div />
    </>
  );
}

export default function SelectLimoPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SelectLimoClient />
    </Suspense>
  );
}
