'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateBooking } from '@travel-suite/frontend-shared/hooks/limo-bookings/useCreateBooking';
import { useLimoBooking } from '@travel-suite/frontend-shared/contexts/LimoBookingContext';
import { FaStripe, FaLock } from 'react-icons/fa6';
import { trackBeginCheckout, trackBookingDetailsEntered } from '@/lib/analytics';
import SectionTitle from '@/components/SectionTitle';
import Input from '@/components/FormElements/Input';
import BookingSummary from '@/components/BookingSummary';
import PhoneNumber from '@/components/FormElements/PhoneNumber';
import SelectTime from '@/components/FormElements/SelectTime';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function BookingDetails() {
  const router = useRouter();
  const { createBooking, isCreatingBooking } = useCreateBooking();
  const { bookingData, isHydrated, isAirportTransfer, handleChange } = useLimoBooking();
  const {
    tripType,
    pickup,
    dropoff,
    pickupDate,
    pickupTime,
    hoursBooked,
    vehicle,
    bookingDetails,
    payment,
    orderSummary,
  } = bookingData;

  const { firstName, lastName, email, phoneNumber } = bookingDetails;

  function validateBookingForm() {
    if (!firstName) return "Please enter the passenger's first name.";
    if (!lastName) return "Please enter the passenger's last name.";
    if (!email) return "Please enter the passenger's email address.";
    if (!EMAIL_RE.test(email.trim())) return 'That email address does not look right. Your confirmation goes there.';
    if (!phoneNumber?.number?.trim()) return "Please enter the passenger's phone number.";
    if (phoneNumber.number.replace(/\D/g, '').length < 7) return 'Please enter a full phone number.';
    if (isAirportTransfer && !bookingDetails?.flightNumber) return 'Please enter your flight number.';
    if (isAirportTransfer && !bookingDetails?.arrivalTime) return 'Please select the time your flight lands.';
    return null;
  }

  const error = validateBookingForm(bookingData);

  useEffect(() => {
    if (!isHydrated) return;
    if (tripType === 'distance') {
      if (!pickup?.name || !dropoff?.name || !pickupDate || !pickupTime) router.push('/');
    }
    if (tripType === 'hourly') {
      if (!pickup?.name || !hoursBooked || !pickupDate || !pickupTime) router.push('/');
    }
    if (!vehicle) router.push('/book/select-limo');
  }, [isHydrated, tripType, pickup, dropoff, pickupDate, pickupTime, hoursBooked, vehicle, router]);

  function handleSubmit() {
    const items = [];
    if (isAirportTransfer) {
      items[0] = { item_name: 'Airport Transfer', quantity: 1 };
    } else {
      items[0] = { item_name: 'Chauffeur Service', quantity: 1 };
    }
    trackBookingDetailsEntered({
      tripType,
      isAirportTransfer,
      hasNotes: !!bookingDetails?.message,
    });
    trackBeginCheckout({
      currency: orderSummary?.currency?.toUpperCase(),
      value: orderSummary?.total,
      items,
    });
    createBooking({ ...bookingData, payment: { ...payment, method: 'stripe' } });
  }

  return (
    <>
      <div className="flex flex-col gap-8 lg:gap-12 w-full p-5 lg:p-7 bg-white rounded-xl shadow-xl shadow-gray-300">
        <PassengerInformation onChange={handleChange} bookingData={bookingData} isAirportTransfer={isAirportTransfer} />
        <PaymentNote />
      </div>
      <div>
        <BookingSummary
          btnText={isCreatingBooking ? 'Taking you to payment' : 'Proceed to Payment'}
          btnDisabled={!!error || isCreatingBooking}
          btnNote={error}
          btnOnClick={handleSubmit}
        />
      </div>
    </>
  );
}

function PassengerInformation({ onChange, bookingData, isAirportTransfer }) {
  return (
    <div>
      <SectionTitle className="lg:mb-0">Passenger Information</SectionTitle>
      <p className="font-extralight text-[14px] text-primary-500 leading-6 pt-5">
        Please fill in your contact details for a seamless pickup and drop-off experience.
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-2 gap-3 mt-3">
        <Input
          label="First Name"
          required
          autoComplete="given-name"
          value={bookingData.bookingDetails.firstName}
          onChange={(e) => onChange('firstName', e.target.value)}
        />
        <Input
          label="Last Name"
          required
          autoComplete="family-name"
          value={bookingData.bookingDetails.lastName}
          onChange={(e) => onChange('lastName', e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
        <Input
          label="Email Address"
          required
          type="email"
          inputMode="email"
          autoComplete="email"
          tooltip="Enter your email so we can send your booking details and updates"
          value={bookingData.bookingDetails.email}
          onChange={(e) => onChange('email', e.target.value)}
        />
        <PhoneNumber required tooltip="Enter your phone number so we can contact you about your ride if needed" />
      </div>
      {isAirportTransfer && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
          <Input
            label="Flight Number"
            required
            autoComplete="off"
            autoCapitalize="characters"
            tooltip="We need your flight number to track your flight and ensure timely pickup"
            placeholder="eg. EK203"
            value={bookingData.bookingDetails.flightNumber}
            onChange={(e) => onChange('flightNumber', e.target.value.toUpperCase())}
          />
          <div className="flex flex-col gap-1">
            <span className="text-[14px] font-light text-gray-700 flex items-center gap-1">
              Flight lands at <span className="text-red-500 font-semibold">*</span>
            </span>
            <SelectTime
              name="arrivalTime"
              label="Scheduled landing time"
              placeholder="Select time"
              value={bookingData.bookingDetails.arrivalTime}
              onChange={(value) => onChange('arrivalTime', value)}
            />
            <p className="text-[12.5px] font-light text-primary-500">We track the flight, so a delay changes nothing for you.</p>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-1 mt-3">
        <label className="font-light text-[14px]">
          Special Requests / Notes <span className="text-primary-300">(optional)</span>
        </label>
        <textarea
          rows={5}
          placeholder={`e.g., \u201cNeed a baby seat\u201d`}
          className="w-full bg-transparent text-[14px] font-light px-4 py-2 rounded-md border border-gray-300 focus:border-primary-900 outline-0"
          value={bookingData.bookingDetails.message}
          onChange={(e) => onChange('message', e.target.value)}
        />
      </div>
    </div>
  );
}

function PaymentNote() {
  return (
    <div>
      <SectionTitle className="lg:mb-0">Payment</SectionTitle>
      <div className="mt-5 flex items-start gap-3 rounded-xl border border-primary-100 bg-primary-50 p-4">
        <FaStripe className="text-3xl shrink-0" style={{ color: '#5433ff' }} />
        <div className="text-[14px] font-light text-primary-700 leading-6">
          <p className="flex items-center gap-2">
            <FaLock className="text-[12px]" /> You pay securely on Stripe&apos;s checkout page. We never see or store your card.
          </p>
          <p className="mt-1 text-primary-500">
            Your chauffeur&apos;s name and number are emailed the day before pickup. Until then our team is on WhatsApp 24/7.
          </p>
        </div>
      </div>
    </div>
  );
}
