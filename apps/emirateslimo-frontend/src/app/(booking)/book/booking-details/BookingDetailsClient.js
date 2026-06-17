'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateBooking } from '@travel-suite/frontend-shared/hooks/limo-bookings/useCreateBooking';
import { useLimoBooking } from '@travel-suite/frontend-shared/contexts/LimoBookingContext';
import { FaStripe } from 'react-icons/fa6';
import { FaCheckCircle } from 'react-icons/fa';
import { trackBeginCheckout, trackBookingDetailsEntered } from '@/lib/analytics';
import SectionTitle from '@/components/SectionTitle';
import Input from '@/components/FormElements/Input';
import BookingSummary from '@/components/BookingSummary';
import PhoneNumber from '@/components/FormElements/PhoneNumber';
import { trackBeginCheckoutMeta } from '@/lib/meta';

const paymentMethods = [
  {
    name: 'Stripe',
    id: 'stripe',
    icon: <FaStripe />,
    text: 'Pay Securely with Stripe',
    color: '#5433ff',
  },
];

export default function BookingDetails() {
  const router = useRouter();
  const { createBooking, isCreatingBooking } = useCreateBooking();
  const { bookingData, isAirportTransfer, handleChange, handleSelectPaymentMethod } = useLimoBooking();
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
    if (!phoneNumber?.number?.trim()) return "Please enter the passenger's phone number.";
    if (!payment?.method) return 'Please select a payment method to proceed.';
    if (isAirportTransfer && (!bookingDetails?.flightNumber || !bookingDetails?.arrivalTime))
      return 'Please enter your flight details.';
    return null;
  }

  const error = validateBookingForm(bookingData);

  useEffect(() => {
    if (tripType === 'distance') {
      if (!pickup?.name || !dropoff?.name || !pickupDate || !pickupTime) router.push('/');
    }
    if (tripType === 'hourly') {
      if (!pickup?.name || !hoursBooked || !pickupDate || !pickupTime) router.push('/');
    }
    if (!vehicle) router.push('/book/select-limo');
  }, [tripType, pickup, dropoff, pickupDate, pickupTime, hoursBooked, vehicle, router]);

  function handleSubmit() {
    const items = [];
    if (isAirportTransfer) {
      items[0] = { item_name: 'Airport Transfer', quantity: 1 };
    } else {
      items[0] = { item_name: 'Chauffeur Service', quantity: 1 };
    }
    trackBookingDetailsEntered({
      firstName: bookingDetails?.firstName,
      lastName: bookingDetails?.lastName,
      email: bookingDetails?.email,
      phoneNumber: `${bookingDetails?.phoneNumber?.code}-${bookingDetails?.phoneNumber?.number}`,
      flightNumber: bookingDetails?.flightNumber || null,
      arrivalTime: bookingDetails?.arrivalTime || null,
      message: bookingDetails?.message || null,
    });
    trackBeginCheckout({
      currency: orderSummary?.currency?.toUpperCase(),
      value: orderSummary?.total,
      items,
    });
    trackBeginCheckoutMeta({
      currency: 'AED',
      value: orderSummary?.total,
    });
    createBooking({ ...bookingData });
  }

  return (
    <>
      <div className="flex flex-col gap-8 lg:gap-12 w-full p-5 lg:p-7 bg-white rounded-xl shadow-xl shadow-gray-300">
        <PassengerInformation onChange={handleChange} bookingData={bookingData} isAirportTransfer={isAirportTransfer} />
        <PaymentOptions selected={payment.method} onSelect={handleSelectPaymentMethod} />
      </div>
      <div>
        <BookingSummary
          btnText="Proceed to Payment"
          btnDisabled={error || isCreatingBooking}
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
          value={bookingData.bookingDetails.firstName}
          onChange={(e) => onChange('firstName', e.target.value)}
        />
        <Input
          label="Last Name"
          required
          value={bookingData.bookingDetails.lastName}
          onChange={(e) => onChange('lastName', e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
        <Input
          label="Email Address"
          required
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
            tooltip="We need your flight number to track your flight and ensure timely pickup"
            placeholder="eg. AC057"
            value={bookingData.bookingDetails.flightNumber}
            onChange={(e) => onChange('flightNumber', e.target.value)}
          />
          <Input
            label="Estimated Arrival Time"
            required
            tooltip="Enter your scheduled arrival time. We'll track delays and you won't be charged extra."
            value={bookingData.bookingDetails.arrivalTime}
            onChange={(e) => onChange('arrivalTime', e.target.value)}
          />
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

function PaymentOptions({ selected, onSelect }) {
  return (
    <div>
      <SectionTitle className="lg:mb-0">Payment</SectionTitle>
      <p className="font-extralight text-[14px] text-primary-500 leading-6 pt-5">
        Select your preferred payment method. Your details are processed securely by our trusted partners. We do not
        store any credit/debit card details.
      </p>
      <div className="flex flex-col gap-2 mt-4">
        {paymentMethods.map((method) => (
          <SelectPaymentButton
            key={method.id}
            id={method.id}
            icon={method.icon}
            text={method.text}
            color={method.color}
            isSelected={selected === method.id}
            onClick={() => onSelect(method.id)}
          />
        ))}
      </div>
    </div>
  );
}

function SelectPaymentButton({ onClick, isSelected, icon, text, color = '#000' }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`w-full flex items-center justify-between rounded-xl border-2 transition-all duration-300 p-4 shadow-sm cursor-pointer ${
        isSelected
          ? 'border-primary-900 bg-primary-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-primary-200 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl" style={isSelected ? { color } : {}}>
            {icon}
          </span>
          <span className={`text-[14px] font-light ${isSelected ? 'text-primary-700' : 'text-gray-700'}`}>{text}</span>
        </div>
      </div>
      {isSelected && <FaCheckCircle className="text-primary-900" />}
    </button>
  );
}
