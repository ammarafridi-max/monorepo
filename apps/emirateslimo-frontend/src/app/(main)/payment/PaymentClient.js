'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useGetBooking } from '@travel-suite/frontend-shared/hooks/limo-bookings/useGetBooking';
import { useLocalStorage } from '@travel-suite/frontend-shared/hooks/general/useLocalStorage';
import { FaCheck, FaX } from 'react-icons/fa6';
import { format } from 'date-fns';
import { trackPurchaseEvent } from '@/lib/analytics';
import PrimarySection from '@/components/PrimarySection';
import Container from '@/components/Container';
import Loading from '@/components/Loading';
import PageHeading from '@/components/PageHeading';
import { trackPurchaseEventMeta } from '@/lib/meta';

export default function PaymentClient() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const { booking, isLoadingBooking } = useGetBooking(id);

  if (isLoadingBooking) return <Loading />;
  if (!booking) return <Failure />;

  const paymentStatus = booking?.payment?.status?.toUpperCase();

  return (
    <PrimarySection className="py-10 lg:py-15">
      <Container>
        {paymentStatus === 'PAID' ? <Success booking={booking} /> : <Failure />}
      </Container>
    </PrimarySection>
  );
}

function Success({ booking }) {
  const {
    tripType,
    hoursBooked,
    bookingRef,
    pickup,
    dropoff,
    pickupDate,
    pickupTime,
    vehicle,
    bookingDetails,
    payment,
  } = booking;
  const customerName = `${bookingDetails?.firstName}`;
  const { deleteLocalStorage } = useLocalStorage();

  useEffect(() => {
    const items = [];
    if (pickup?.type === 'airport' || dropoff?.type === 'airport') {
      items[0] = { item_name: 'Airport Transfer', quantity: 1 };
    } else {
      items[0] = { item_name: 'Chauffeur Service', quantity: 1 };
    }
    trackPurchaseEvent({
      currency: payment?.currency,
      value: payment?.amount,
      transactionId: payment?.transactionId,
      items,
    });
    trackPurchaseEventMeta({
      currency: 'AED',
      value: payment?.amount,
      transactionId: payment?.transactionId,
    });
    deleteLocalStorage('bookingData');
  }, [
    pickup?.type,
    dropoff?.type,
    payment?.currency,
    payment?.amount,
    payment?.transactionId,
    deleteLocalStorage,
  ]);

  return (
    <div className="w-full lg:w-230 mx-auto">
      <div className="flex items-center justify-center bg-green-700 w-20 h-20 lg:w-25 lg:h-25 rounded-full mx-auto mb-5">
        <FaCheck size={40} className="text-white" />
      </div>
      <PageHeading className="text-3xl lg:text-4xl text-center my-5">Payment Successfully Processed</PageHeading>
      <p className="text-center text-md lg:text-lg font-extralight leading-7">
        Thank you for your booking {customerName}. Your limo has been reserved on{' '}
        {format(new Date(pickupDate), 'dd LLLL yyyy')} at {pickupTime}. Your driver will be assigned a day before your
        trip and their contact details will be shared with you via email.
      </p>
      <div className="bg-white shadow-[0px_0px_15px_0px_rgba(0,0,0,0.2)] rounded-xl p-6 mt-6 text-gray-700 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-10 lg:divide-x divide-primary-300">
          <div className="mt-5">
            <h3 className="text-lg lg:text-xl mb-4 font-medium">Trip Details</h3>
            <p className="font-normal mb-2">
              Booking Reference: <span className="font-extralight">{bookingRef}</span>
            </p>
            <p className="font-normal mb-2">
              Pickup Address:{' '}
              <span className="font-extralight">
                {pickup?.name} - {pickup?.address}
              </span>
            </p>
            {tripType === 'distance' ? (
              <p className="font-normal mb-2">
                Dropoff Address:{' '}
                <span className="font-extralight">
                  {dropoff?.name} - {dropoff?.address}
                </span>
              </p>
            ) : (
              <p className="font-normal mb-2">
                Hours Booked: <span className="font-extralight">{hoursBooked}</span>
              </p>
            )}
            <p className="font-normal mb-2">
              Date and Time:{' '}
              <span className="font-extralight">
                {format(new Date(pickupDate), 'dd LLLL yyyy')} at {pickupTime}
              </span>
            </p>
            <p className="font-normal mb-2">
              Limo:{' '}
              <span className="font-extralight">
                {vehicle?.brand} {vehicle?.model}
              </span>
            </p>
          </div>
          <div className="mt-5">
            <h3 className="text-lg lg:text-xl mb-4 font-medium">Passenger Details</h3>
            <p className="font-normal mb-2">
              Name: <span className="font-extralight">{customerName}</span>
            </p>
            <p className="font-normal mb-2">
              Email Address: <span className="font-extralight">{bookingDetails?.email}</span>
            </p>
            <p className="font-normal mb-2">
              Phone Number:{' '}
              <span className="font-extralight">
                {bookingDetails?.phoneNumber?.code}-{bookingDetails?.phoneNumber?.number}
              </span>
            </p>
            <p className="font-normal">
              Amount Paid:{' '}
              <span className="font-extralight">
                {payment?.currency?.toUpperCase()} {payment?.amount}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Failure() {
  return (
    <>
      <div className="flex items-center justify-center bg-red-700 w-20 h-20 lg:w-25 lg:h-25 rounded-full mx-auto mb-5">
        <FaX size={40} className="text-white" />
      </div>
      <PageHeading className="text-2xl lg:text-4xl text-center">Payment Not Found</PageHeading>
    </>
  );
}
