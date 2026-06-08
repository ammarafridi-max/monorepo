'use client';

import { useContext, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAvailableVehicles } from '@/hooks/bookings/useAvailableVehicles';
import { BookingContext } from '@/context/BookingContext';
import VehicleCard from '@/components/VehicleCard';
import VehicleLoadingCard from '@/components/VehicleLoadingCard';
import BookingSummary from '@/components/BookingSummary';

export default function SelectLimoClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { bookingData } = useContext(BookingContext);
  const { tripType, pickup, dropoff, pickupDate, pickupTime, hoursBooked } = bookingData;
  const { vehicles, isLoadingVehicles, isErrorVehicles, errorVehicles } = useAvailableVehicles(bookingData);

  useEffect(() => {
    if (tripType === 'distance' && (!pickup?.name || !dropoff?.name || !pickupDate || !pickupTime)) router.push('/');
    if (tripType === 'hourly' && (!pickup?.name || !hoursBooked || !pickupDate || !pickupTime)) router.push('/');
  }, [tripType, pickup?.name, dropoff?.name, pickupDate, pickupTime, hoursBooked, router]);

  if (isErrorVehicles) return <p>Error loading vehicles: {errorVehicles.message}</p>;

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
          {vehicles?.map((vehicle) => (
            <VehicleCard
              key={vehicle?.id}
              vehicle={vehicle}
              disabled={searchParams.get('vehicleId') === vehicle._id}
            />
          ))}
        </div>
      </div>
      <div>
        <BookingSummary
          btnText="Enter Contact Details"
          btnDisabled={!bookingData?.vehicle}
          btnOnClick={() => router.push('/book/booking-details')}
        />
      </div>
    </>
  );
}
