'use client';

import { useContext, useEffect, useMemo, useState } from 'react';
import { useCreateDummyTicket } from '../../../hooks/dummy-tickets/useCreateDummyTicket';
import { isEmail } from 'validator';
import { TicketContext } from '../../../contexts/TicketContext.js';
import Input from '../form-elements/Input';
import Label from '../form-elements/Label';
import DatePicker from '../form-elements/DatePicker';
import SelectTitle from '../form-elements/SelectTitle';
import TextArea from '../form-elements/TextArea';
import Email from '../form-elements/Email';
import PhoneInput from '../form-elements/PhoneInput';
import PrimaryButton from '../ui/PrimaryButton';
import SegmentedRadioGroup from '../form-elements/SegmentedRadioGroup';

import { useDummyTicketPricing } from '../../../hooks/pricing/useDummyTicketPricing';
import { normalizePricingOptions } from '../../../utils/dummyTicketPricing';
import { useCurrency } from '../../../contexts/CurrencyContext.js';
import { todayDateOnly } from '../../../utils/dates';

// Default pricing fallback (used when no dynamic pricing is returned from the API)
const PRICING_OPTIONS = [
  { value: '2 Days', label: '2 Days', price: 49 },
  { value: '7 Days', label: '7 Days', price: 69 },
  { value: '14 Days', label: '14 Days', price: 79 },
];

const FormRow = ({ children }) => (
  <div className="block lg:grid lg:grid-cols-2 lg:gap-2.5">{children}</div>
);
const FormItem = ({ children }) => (
  <div className="w-full flex flex-col gap-1.5 mb-3 lg:mb-5">{children}</div>
);

export default function FlightForm() {
  const [isBtnDisabled, setIsBtnDisabled] = useState(true);
  const { createDummyTicket, isCreatingDummyTicket } = useCreateDummyTicket();
  const { pricing } = useDummyTicketPricing();
  const { selectedCurrency, formatMoney } = useCurrency();
  const {
    type,
    from,
    to,
    departureDate,
    returnDate,
    quantity,
    passengers,
    email,
    phoneNumber,
    message,
    ticketValidity,
    receiveNow,
    deliveryDate,
    departureFlight,
    returnFlight,
    affiliateAttribution,
    setEmail,
    setPhoneNumber,
    setReceiveNow,
    setDeliveryDate,
    setMessage,
    initializePassengers,
    updatePassengerData,
    updatePricing,
  } = useContext(TicketContext);
  const pricingOptions = useMemo(
    () => normalizePricingOptions(pricing),
    [pricing],
  );
  const displayPricingOptions = useMemo(() => {
    return (pricingOptions.length > 0 ? pricingOptions : PRICING_OPTIONS).map(
      (option) => ({
        ...option,
        price: formatMoney(option.price, 'AED').amount,
      }),
    );
  }, [formatMoney, pricingOptions]);

  useEffect(() => {
    if (quantity && passengers.length === 0) {
      initializePassengers(quantity);
    }
  }, [initializePassengers, quantity, passengers]);

  useEffect(() => {
    function validateForm() {
      if (passengers?.some((p) => !p.title || !p.firstName || !p.lastName)) {
        setIsBtnDisabled(true);
        return false;
      }
      if (!email) {
        setIsBtnDisabled(true);
        return false;
      }
      if (!isEmail(email)) {
        setIsBtnDisabled(true);
        return false;
      }
      if (!phoneNumber.code || !phoneNumber.digits) {
        setIsBtnDisabled(true);
        return false;
      }
      if (!receiveNow && !deliveryDate) {
        setIsBtnDisabled(true);
        return false;
      }
      setIsBtnDisabled(false);
      return true;
    }
    validateForm();
  }, [passengers, email, phoneNumber, receiveNow, deliveryDate]);

  useEffect(() => {
    const options =
      displayPricingOptions.length > 0
        ? displayPricingOptions
        : PRICING_OPTIONS;
    const selectedOption =
      options.find((option) => option.value === ticketValidity) || options[0];

    if (!selectedOption) return;

    updatePricing({
      ticketValidity: selectedOption.value,
      ticketPrice: selectedOption.price,
    });
  }, [displayPricingOptions, ticketValidity, updatePricing]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (isCreatingDummyTicket) return;
    localStorage.setItem('email', email);
    localStorage.setItem('phoneNumber', JSON.stringify(phoneNumber));

    createDummyTicket({
      type,
      from,
      to,
      departureDate,
      returnDate,
      quantity,
      passengers,
      email,
      phoneNumber,
      message,
      ticketValidity,
      currency: selectedCurrency?.code || 'AED',
      affiliateId: affiliateAttribution?.affiliateId || null,
      affiliateCapturedAt: affiliateAttribution?.capturedAt || null,
      ticketDelivery: {
        immediate: receiveNow,
        deliveryDate: receiveNow ? null : deliveryDate,
      },
      flightDetails: {
        departureFlight,
        returnFlight: type === 'One Way' ? null : returnFlight,
      },
    });
  }

  return (
    <form
      className="flex flex-col mt-2.5 p-6 lg:p-6.25 rounded-xl bg-gray-100"
      onSubmit={handleSubmit}
    >
      {passengers.length > 0 && (
        <PassengerData
          passengers={passengers}
          updatePassengerData={updatePassengerData}
        />
      )}

      <ContactDetails
        email={email}
        setEmail={setEmail}
        phoneNumber={phoneNumber}
        setPhoneNumber={setPhoneNumber}
      />

      <TicketValidityOptions
        ticketValidity={ticketValidity}
        updatePricing={updatePricing}
        options={displayPricingOptions}
        currencyCode={selectedCurrency?.code || 'AED'}
      />

      <TicketDelivery
        receiveNow={receiveNow}
        setReceiveNow={setReceiveNow}
        deliveryDate={deliveryDate}
        setDeliveryDate={setDeliveryDate}
      />

      <Message message={message} setMessage={setMessage} />

      <PrimaryButton
        className="w-full mt-5"
        disabled={isBtnDisabled || isCreatingDummyTicket}
      >
        {isCreatingDummyTicket ? 'Processing...' : 'Review Your Information'}
      </PrimaryButton>
    </form>
  );
}

function PassengerData({ passengers, updatePassengerData }) {
  let adultCount = 0;
  let childCount = 0;
  let infantCount = 0;

  return (
    <FormRow>
      {passengers.map((passenger, index) => {
        let label =
          passenger.type === 'Adult'
            ? `Adult ${++adultCount}`
            : passenger.type === 'Child'
              ? `Child ${++childCount}`
              : `Infant ${++infantCount}`;

        return (
          <FormItem key={index}>
            <Label>{label}</Label>
            <div className="w-full flex gap-1.25">
              <SelectTitle
                value={passenger.title}
                onChange={(e) =>
                  updatePassengerData(index, 'title', e.target.value)
                }
              />
              <Input
                value={passenger.firstName}
                placeholder="First Name"
                onChange={(e) =>
                  updatePassengerData(index, 'firstName', e.target.value)
                }
              />
              <Input
                value={passenger.lastName}
                placeholder="Last Name"
                onChange={(e) =>
                  updatePassengerData(index, 'lastName', e.target.value)
                }
              />
            </div>
          </FormItem>
        );
      })}
    </FormRow>
  );
}

function ContactDetails({ email, setEmail, phoneNumber, setPhoneNumber }) {
  return (
    <FormRow>
      <FormItem>
        <Label>Email Address</Label>
        <Email email={email} onChange={(e) => setEmail(e.target.value)} />
      </FormItem>
      <FormItem>
        <Label>Phone Number</Label>
        <PhoneInput value={phoneNumber} onChange={setPhoneNumber} />
      </FormItem>
    </FormRow>
  );
}

function TicketValidityOptions({
  ticketValidity,
  updatePricing,
  options,
  currencyCode,
}) {
  const handleChange = (option) => {
    updatePricing({ ticketValidity: option.value, ticketPrice: option.price });
  };

  return (
    <FormItem>
      <Label>Choose Ticket Validity</Label>
      <SegmentedRadioGroup
        name="ticketValidity"
        options={options}
        value={ticketValidity}
        onChange={handleChange}
        currencyCode={currencyCode}
      />
    </FormItem>
  );
}

function TicketDelivery({
  receiveNow,
  deliveryDate,
  setReceiveNow,
  setDeliveryDate,
}) {
  return (
    <FormRow>
      <FormItem>
        <Label>Ticket Delivery Type</Label>
        <div>
          <div className="font-light text-[14.5px]">
            <input
              type="radio"
              checked={receiveNow}
              onChange={() => setReceiveNow(true)}
            />{' '}
            <span className="ml-3">I need it now</span>
          </div>
          <div className="font-light text-[14.5px]">
            <input
              type="radio"
              checked={!receiveNow}
              onChange={() => setReceiveNow(false)}
            />{' '}
            <span className="ml-3">I need it on a later date</span>
          </div>
        </div>
      </FormItem>
      {!receiveNow && (
        <FormItem>
          <Label>Deliver Ticket On</Label>
          <DatePicker
            value={deliveryDate}
            onChange={setDeliveryDate}
            minDate={todayDateOnly()}
            placeholder="Select delivery date"
          />
        </FormItem>
      )}
    </FormRow>
  );
}

function Message({ message, setMessage }) {
  return (
    <FormItem>
      <Label optional>Special Requests</Label>
      <TextArea value={message} onChange={(e) => setMessage(e.target.value)} />
    </FormItem>
  );
}
