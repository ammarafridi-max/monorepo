'use client';
import { useContext, useState } from 'react';
import { BookingContext } from '../context/BookingContext';
import { useVehicle } from '../hooks/vehicles/useVehicle';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { HiChevronDown, HiChevronRight } from 'react-icons/hi2';
import { FaCheck, FaChevronRight } from 'react-icons/fa6';
import { CurrencyContext } from '../context/CurrencyContext';
import Button from './Button';
import Container from './Container';

void motion;

export default function BookingSummary({ btnText, btnOnClick, btnDisabled }) {
  const { currency } = useContext(CurrencyContext);
  const {
    bookingData: { tripType, hoursBooked, pickup, dropoff, pickupDate, pickupTime, orderSummary, vehicle },
  } = useContext(BookingContext);
  const { vehicle: vehicleData } = useVehicle(vehicle);

  return (
    <div>
      <TripSummary
        tripType={tripType}
        hoursBooked={hoursBooked}
        pickup={pickup}
        dropoff={dropoff}
        pickupDate={pickupDate}
        pickupTime={pickupTime}
        vehicle={vehicle}
        vehicleData={vehicleData}
      />

      <OrderSummary currency={currency} orderSummary={orderSummary} />

      <div className="hidden lg:block">
        <Button className="w-full" disabled={btnDisabled} onClick={btnOnClick}>
          {btnText}
        </Button>
      </div>

      <div className="fixed lg:hidden w-full bottom-0 left-0 bg-white py-5 shadow-[0px_0px_15px_10px_rgba(0,0,0,0.2)]">
        <Container className="grid grid-cols-[3.5fr_6.5fr] items-center gap-2">
          <div>
            <p className="text-sm font-extralight">Total:</p>
            <p className="text-lg font-medium">
              {currency?.sign} {orderSummary?.total?.toFixed(2)}
            </p>
          </div>
          <div>
            <Button className="w-full flex items-center gap-2 px-2" disabled={btnDisabled} onClick={btnOnClick}>
              <span>{btnText}</span> <FaChevronRight />
            </Button>
          </div>
        </Container>
      </div>

      {/* Terms Note */}
      <p className="text-center text-[12px] mt-3 font-extralight px-3 text-primary-500">
        By proceeding, you agree to our{' '}
        <a
          href="/terms-and-conditions"
          className="text-accent-600 hover:text-accent-700 underline-offset-2 hover:underline"
        >
          Terms & Conditions
        </a>{' '}
        and our{' '}
        <a href="/privacy-policy" className="text-accent-600 hover:text-accent-700 underline-offset-2 hover:underline">
          Privacy Policy
        </a>
        .
      </p>

      {/* <Benefits /> */}
    </div>
  );
}

function TripSummary({ tripType, hoursBooked, pickup, dropoff, pickupDate, pickupTime, vehicle, vehicleData }) {
  const [showTripSummary, setShowTripSummary] = useState(false);

  return (
    <div className="h-fit mt-5 mb-5 px-4 lg:mt-0 lg:mb-3 bg-white rounded-xl border border-primary-100 shadow-[0px_0px_5px_rgba(0,0,0,0.04)] overflow-hidden">
      <button
        type="button"
        className="w-full grid grid-cols-[1fr_auto] justify-between items-center duration-300 py-2.5 px-3 cursor-pointer border-b border-primary-100"
        onClick={() => setShowTripSummary((val) => !val)}
      >
        <h2 className="text-lg text-left">Trip Summary</h2>
        <span className="bg-white rounded-full text-md flex items-center justify-center duration-300">
          {showTripSummary ? <HiChevronDown /> : <HiChevronRight />}
        </span>
      </button>
      <motion.div
        initial={false}
        animate={{
          height: showTripSummary ? 'auto' : 0,
          opacity: showTripSummary ? 1 : 0,
          paddingTop: showTripSummary ? 4 : 0,
          paddingBottom: showTripSummary ? 4 : 0,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="divide-y divide-primary-100 overflow-hidden"
      >
        {tripType === 'distance' && <Detail label="Trip Type" value="Point-to-Point" />}
        {tripType === 'hourly' && <Detail label="Trip Type" value="Hourly" />}
        {tripType === 'hourly' && <Detail label="Hours" value={hoursBooked} />}
        <Detail label="Pickup Location" value={pickup?.name} />
        {tripType === 'distance' && <Detail label="Dropoff Location" value={dropoff?.name} />}
        <Detail label="Pickup Date" value={pickupDate ? `${format(new Date(pickupDate), 'dd LLLL yyyy')}` : ''} />
        <Detail label="Pickup Time" value={pickupTime ? pickupTime : ''} />
        <Detail
          label="Vehicle Selected"
          value={vehicle ? `${vehicleData?.brand || ''} ${vehicleData?.model || ''}` : 'Please select your limo'}
        />
      </motion.div>
    </div>
  );
}

function OrderSummary({ currency, orderSummary }) {
  const formatPrice = (amount) => `${currency?.sign} ${(amount || 0).toFixed(2)}`;

  return (
    <div className="h-fit mt-5 mb-5 px-4 lg:mt-0 lg:mb-3 bg-white rounded-xl border border-primary-100 shadow-[0px_0px_5px_rgba(0,0,0,0.04)] overflow-hidden">
      <button
        type="button"
        className="w-full grid grid-cols-[1fr_auto] justify-between items-center duration-300 py-2.5 px-3 border-b border-primary-100"
      >
        <h2 className="text-lg text-left">Order Summary</h2>
      </button>
      <div className="flex flex-col gap-2 py-3">
        <div className="flex items-center justify-between font-light text-sm px-3">
          <p className="text-primary-500">Limo Price</p>
          <p className="text-primary-900 font-normal">{formatPrice(orderSummary?.baseFare)}</p>
        </div>
        <div className="flex items-center justify-between font-light text-sm px-3">
          <p className="text-primary-500">Extras Price</p>
          <p className="text-primary-900 font-normal">{formatPrice(orderSummary?.addOns)}</p>
        </div>
        <div className="flex items-center justify-between font-light text-sm px-3">
          <p className="text-primary-500">Tax</p>
          <p className="text-primary-900 font-normal">{formatPrice(orderSummary?.taxes)}</p>
        </div>
        <div className="border-t border-primary-100 mt-2 pt-2 px-3 flex justify-between items-center font-medium text-sm">
          <p className="text-primary-800">Total</p>
          <p className="text-accent-600 font-semibold">{formatPrice(orderSummary?.total)}</p>
        </div>
      </div>
    </div>
  );
}

function Benefits() {
  return (
    <div className="flex flex-col gap-2 mt-5">
      <div className="grid grid-cols-[auto_1fr] items-center gap-3">
        <span className="bg-green-600 w-5 h-5 rounded-full flex items-center justify-center">
          <FaCheck className="text-white text-[12px]" />
        </span>
        <p className="text-[13px] font-extralight leading-4.5 text-primary-500">
          Free 60 minutes waiting time on airport transfers
        </p>
      </div>
      <div className="grid grid-cols-[auto_1fr] items-center gap-3">
        <span className="bg-green-600 w-5 h-5 rounded-full flex items-center justify-center">
          <FaCheck className="text-white text-[12px]" />
        </span>
        <p className="text-[13px] font-extralight leading-4.5 text-primary-500">
          Complimentary water bottle in each ride
        </p>
      </div>
      <div className="grid grid-cols-[auto_1fr] items-center gap-3">
        <span className="bg-green-600 w-5 h-5 rounded-full flex items-center justify-center">
          <FaCheck className="text-white text-[12px]" />
        </span>
        <p className="text-[13px] font-extralight leading-4.5 text-primary-500">
          Multilingual chauffeurs with decades of experience
        </p>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 lg:block py-2.5 px-3">
      <label className="text-[12px] text-gray-500 uppercase font-extralight tracking-wide block mb-0.5 leading-5 md:leading-4">
        {label}
      </label>
      <p className="text-[15px] font-light text-right lg:text-left text-primary-900">{value || '—'}</p>
    </div>
  );
}
