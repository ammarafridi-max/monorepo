'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGetAvailableVehicles } from '@travel-suite/frontend-shared/hooks/limo-bookings/useGetAvailableVehicles';
import { useLimoBooking } from '@travel-suite/frontend-shared/contexts/LimoBookingContext';
import VehicleCard from '@/components/VehicleCard';
import VehicleLoadingCard from '@/components/VehicleLoadingCard';
import BookingSummary from '@/components/BookingSummary';
import Button from '@/components/Button';
import { WHATSAPP_URL } from '@/components/WhatsAppCTA';

export default function SelectLimoClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { bookingData, isHydrated } = useLimoBooking();
  const { tripType, pickup, dropoff, pickupDate, pickupTime, hoursBooked } = bookingData;
  const { vehicles, unavailableVehicles, isLoadingVehicles, isErrorVehicles, errorVehicles, refetchVehicles } =
    useGetAvailableVehicles(bookingData);

  useEffect(() => {
    if (!isHydrated) return;
    if (tripType === 'distance' && (!pickup?.name || !dropoff?.name || !pickupDate || !pickupTime)) router.push('/');
    if (tripType === 'hourly' && (!pickup?.name || !hoursBooked || !pickupDate || !pickupTime)) router.push('/');
  }, [isHydrated, tripType, pickup?.name, dropoff?.name, pickupDate, pickupTime, hoursBooked, router]);

  const priced = vehicles.filter((vehicle) => vehicle?.totalPrice > 0);

  return (
    <>
      <div>
        <div className="flex flex-col gap-3 lg:gap-3">
          {isLoadingVehicles && (
            <>
              <VehicleLoadingCard />
              <VehicleLoadingCard />
              <VehicleLoadingCard />
            </>
          )}

          {isErrorVehicles && (
            <EmptyState
              title="We could not load vehicles for this trip"
              text={errorVehicles?.message || 'Please try again in a moment.'}
              action={<Button onClick={() => refetchVehicles()}>Try again</Button>}
            />
          )}

          {!isLoadingVehicles && !isErrorVehicles && priced.length === 0 && (
            <EmptyState
              title="No vehicles are available for this route and time"
              text="Try a different pickup time, or message us on WhatsApp and we will arrange it by hand."
              action={
                <>
                  <Button onClick={() => router.push('/')}>Change trip</Button>
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[14px] font-light text-accent-600 underline-offset-4 hover:underline"
                  >
                    WhatsApp us
                  </a>
                </>
              }
            />
          )}

          {priced.map((vehicle) => (
            <VehicleCard key={vehicle?.id} vehicle={vehicle} disabled={searchParams.get('vehicleId') === vehicle._id} />
          ))}

          {unavailableVehicles.length > 0 && (
            <div className="mt-2 rounded-2xl border border-dashed border-primary-200 bg-white/60 p-4 lg:p-5">
              <p className="text-[13px] font-light text-primary-500">
                Not available for this route:{' '}
                {unavailableVehicles.map((vehicle) => `${vehicle.brand} ${vehicle.model}`).join(', ')}. Message us on{' '}
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="text-accent-600 underline-offset-4 hover:underline">
                  WhatsApp
                </a>{' '}
                if you need one of these.
              </p>
            </div>
          )}
        </div>
      </div>
      <div>
        <BookingSummary
          btnText="Enter Contact Details"
          btnDisabled={!bookingData?.vehicle}
          btnNote={!bookingData?.vehicle && priced.length > 0 ? 'Select a vehicle to continue.' : null}
          btnOnClick={() => router.push('/book/booking-details')}
        />
      </div>
    </>
  );
}

function EmptyState({ title, text, action }) {
  return (
    <div className="rounded-2xl bg-white border border-primary-100 p-6 lg:p-8 text-center">
      <h2 className="text-[18px] font-normal text-primary-900 mb-2">{title}</h2>
      <p className="text-[14px] font-light text-primary-500 mb-5">{text}</p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">{action}</div>
    </div>
  );
}
