import Link from 'next/link';
import { BookingStepsLg, BookingStepsSm } from '@/components/BookingSteps';
import PrimarySection from '@/components/PrimarySection';
import Container from '@/components/Container';
import MobileNavigation from '@/components/MobileNavigation';
import Currency from '@travel-suite/frontend-shared/components/shared/Currency';
import Footer from '@/components/Footer';

export default function BookingLayout({ children }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <PrimarySection className="hidden lg:block bg-white relative py-3 lg:py-5 shadow-md shadow-gray-200 z-50">
        <Container className="grid grid-cols-[1fr_auto] lg:grid-cols-[2fr_8fr_2fr] items-center h-fit">
          <Link href="/">
            <img src="/logo-light.webp" className="w-full object-contain" alt="Emirates Limo" />
          </Link>
          <BookingStepsLg />
          <div className="flex justify-end gap-3">
            <Currency triggerClassName="relative flex items-center text-[12px] gap-2 border border-primary-200 bg-white hover:bg-primary-100 rounded-md px-3 py-1.5 cursor-pointer transition-colors" />
          </div>
        </Container>
      </PrimarySection>

      <MobileNavigation />
      <PrimarySection className="block lg:hidden bg-gray-50 relative pt-4 lg:py-5">
        <Container className="grid grid-cols-[1fr_auto] lg:grid-cols-[2fr_8fr_2fr] items-center h-fit">
          <BookingStepsSm />
          <Currency triggerClassName="relative flex items-center text-[12px] gap-2 border border-primary-200 bg-white hover:bg-primary-100 rounded-md px-3 py-1.5 cursor-pointer transition-colors" />
        </Container>
      </PrimarySection>

      <PrimarySection className="bg-gray-50 flex-1">
        <Container className="py-5 lg:pt-6 lg:pb-10">
          <div className="sm:grid sm:grid-cols-[8fr_4fr] gap-6">
            {children}
          </div>
        </Container>
      </PrimarySection>

      <Footer />
    </div>
  );
}
