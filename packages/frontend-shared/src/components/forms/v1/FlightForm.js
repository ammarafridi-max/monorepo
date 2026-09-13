'use client';

import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useCreateDummyTicket } from '../../../hooks/dummy-tickets/useCreateDummyTicket';
import { isEmail } from 'validator';
import { TicketContext } from '../../../contexts/TicketContext.js';
import Input from '../../form-elements/v1/Input';
import Label from '../../form-elements/v1/Label';
import DatePicker from '../../form-elements/v1/DatePicker';
import SelectTitle from '../../form-elements/v1/SelectTitle';
import TextArea from '../../form-elements/v1/TextArea';
import Email from '../../form-elements/v1/Email';
import PhoneInput from '../../form-elements/v1/PhoneInput';
import PrimaryButton from '../../ui/v1/PrimaryButton';
import FieldError from '../../ui/v1/FieldError';
import SegmentedRadioGroup from '../../form-elements/v1/SegmentedRadioGroup';
import { Tooltip } from 'react-tooltip';
import { FaInfo } from 'react-icons/fa';

import { useDummyTicketPricing } from '../../../hooks/pricing/useDummyTicketPricing';
import { trackAddToCart } from '../../../utils/analytics';
import { normalizePricingOptions } from '../../../utils/dummyTicketPricing';
import { useCurrency } from '../../../contexts/CurrencyContext.js';
import { todayDateOnly } from '../../../utils/dates';

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
  const [errors, setErrors] = useState({});
  const formRef = useRef(null);
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
    ticketPrice,
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

  function passengerError(p) {
    const missing = [];
    if (!p.title) missing.push('title');
    if (!p.firstName) missing.push('first name');
    if (!p.lastName) missing.push('last name');
    return missing.length ? `Enter ${missing.join(', ')}` : null;
  }

  function buildErrors() {
    const next = {};
    passengers.forEach((p, i) => {
      const err = passengerError(p);
      if (err) next[`passenger-${i}`] = err;
    });
    if (!email) next.email = 'Enter your email address';
    else if (!isEmail(email)) next.email = 'Enter a valid email address';
    if (!phoneNumber.code || !phoneNumber.digits) next.phone = 'Enter your phone number';
    if (!receiveNow && !deliveryDate) next.deliveryDate = 'Choose a delivery date';
    return next;
  }

  function clearError(key) {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const { [key]: _removed, ...rest } = prev;
      void _removed;
      return rest;
    });
  }

  useEffect(() => {
    passengers.forEach((p, i) => {
      const key = `passenger-${i}`;
      const err = passengerError(p);
      setErrors((prev) => {
        if (!prev[key] || prev[key] === err) return prev;
        if (!err) {
          const { [key]: _removed, ...rest } = prev;
          void _removed;
          return rest;
        }
        return { ...prev, [key]: err };
      });
    });
    if (email && isEmail(email)) clearError('email');
    if (phoneNumber.code && phoneNumber.digits) clearError('phone');
    if (receiveNow || deliveryDate) clearError('deliveryDate');
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
    const next = buildErrors();
    if (Object.keys(next).length > 0) {
      setErrors(next);
      const firstKey = Object.keys(next)[0];
      const el = formRef.current?.querySelector(`[data-error-key="${firstKey}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el?.querySelector('input, [tabindex]')?.focus();
      return;
    }
    setErrors({});
    localStorage.setItem('email', email);
    localStorage.setItem('phoneNumber', JSON.stringify(phoneNumber));

    trackAddToCart({
      tripType: type,
      ticketValidity,
      price: ticketPrice,
      passengers: quantity.adults + quantity.children,
      currency: selectedCurrency?.code || 'AED',
    });

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
      ref={formRef}
      noValidate
      className="flex flex-col mt-2.5 p-6 lg:p-6.25 rounded-xl bg-gray-100"
      onSubmit={handleSubmit}
    >
      {passengers.length > 0 && (
        <PassengerData
          passengers={passengers}
          updatePassengerData={updatePassengerData}
          errors={errors}
        />
      )}

      <ContactDetails
        email={email}
        setEmail={setEmail}
        phoneNumber={phoneNumber}
        setPhoneNumber={setPhoneNumber}
        errors={errors}
      />

      <TicketValidityOptions
        ticketValidity={ticketValidity}
        updatePricing={updatePricing}
        options={displayPricingOptions}
        currencyCode={selectedCurrency?.code || 'AED'}
        departureDate={departureDate}
      />

      <TicketDelivery
        receiveNow={receiveNow}
        setReceiveNow={setReceiveNow}
        deliveryDate={deliveryDate}
        setDeliveryDate={setDeliveryDate}
        error={errors.deliveryDate}
      />

      <Message message={message} setMessage={setMessage} />

      <PrimaryButton className="w-full mt-5" disabled={isCreatingDummyTicket}>
        {isCreatingDummyTicket ? 'Processing...' : 'Review Your Information'}
      </PrimaryButton>
    </form>
  );
}

function PassengerData({ passengers, updatePassengerData, errors }) {
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
            <div data-error-key={`passenger-${index}`} className="flex flex-col gap-1.5">
            <Label htmlFor={`passenger-${index}-firstName`}>{label}</Label>
            <div className="w-full flex gap-1.25">
              <SelectTitle
                ariaLabel={`${label} title`}
                value={passenger.title}
                onChange={(e) =>
                  updatePassengerData(index, 'title', e.target.value)
                }
              />
              <Input
                id={`passenger-${index}-firstName`}
                aria-label={`${label} first name`}
                autoComplete="given-name"
                value={passenger.firstName}
                placeholder="First Name"
                onChange={(e) =>
                  updatePassengerData(index, 'firstName', e.target.value)
                }
              />
              <Input
                id={`passenger-${index}-lastName`}
                aria-label={`${label} last name`}
                autoComplete="family-name"
                value={passenger.lastName}
                placeholder="Last Name"
                onChange={(e) =>
                  updatePassengerData(index, 'lastName', e.target.value)
                }
              />
            </div>
            {errors[`passenger-${index}`] && (
              <FieldError>{errors[`passenger-${index}`]}</FieldError>
            )}
            </div>
          </FormItem>
        );
      })}
    </FormRow>
  );
}

function ContactDetails({ email, setEmail, phoneNumber, setPhoneNumber, errors }) {
  return (
    <FormRow>
      <FormItem>
        <div data-error-key="email" className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email Address</Label>
          <Email email={email} onChange={(e) => setEmail(e.target.value)} />
          {errors.email && <FieldError>{errors.email}</FieldError>}
        </div>
      </FormItem>
      <FormItem>
        <div data-error-key="phone" className="flex flex-col gap-1.5">
          <Label htmlFor="phone">Phone Number</Label>
          <PhoneInput value={phoneNumber} onChange={setPhoneNumber} inputId="phone" />
          {errors.phone && <FieldError>{errors.phone}</FieldError>}
        </div>
      </FormItem>
    </FormRow>
  );
}

function TicketValidityOptions({
  ticketValidity,
  updatePricing,
  options,
  currencyCode,
  departureDate,
}) {
  const daysToDeparture = departureDate
    ? Math.round((new Date(departureDate) - new Date(todayDateOnly())) / 86_400_000)
    : null;
  const shortNotice = daysToDeparture !== null && daysToDeparture <= 30;

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
      {shortNotice && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
          Your departure is within 30 days, so we cannot guarantee a 14 day reservation on this
          flight. We will book the best option available for the validity you choose.
        </p>
      )}
    </FormItem>
  );
}

const DELIVERY_TOOLTIP =
  'Your validity period starts when the ticket is delivered. Choose now and it starts today. Choose a later date and it starts on that date.';

function TicketDelivery({
  receiveNow,
  deliveryDate,
  setReceiveNow,
  setDeliveryDate,
  error,
}) {
  return (
    <FormRow>
      <FormItem>
        <div className="flex items-center gap-1.5">
          <Label>Ticket Delivery Type</Label>
          <span
            data-tooltip-id="delivery-tooltip"
            data-tooltip-content={DELIVERY_TOOLTIP}
            aria-label={DELIVERY_TOOLTIP}
            className="w-4 h-4 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center cursor-pointer transition-colors shrink-0"
          >
            <FaInfo className="text-gray-500" style={{ fontSize: '8px' }} />
          </span>
          <Tooltip
            id="delivery-tooltip"
            place="top"
            style={{
              maxWidth: '220px',
              fontSize: '12px',
              lineHeight: '1.5',
              borderRadius: '8px',
            }}
          />
        </div>
        <div>
          <label className="block font-light text-[14.5px] cursor-pointer">
            <input
              type="radio"
              name="ticketDelivery"
              checked={receiveNow}
              onChange={() => setReceiveNow(true)}
            />{' '}
            <span className="ml-3">I need it now</span>
          </label>
          <label className="block font-light text-[14.5px] cursor-pointer">
            <input
              type="radio"
              name="ticketDelivery"
              checked={!receiveNow}
              onChange={() => setReceiveNow(false)}
            />{' '}
            <span className="ml-3">I need it on a later date</span>
          </label>
        </div>
      </FormItem>
      {!receiveNow && (
        <FormItem>
          <div data-error-key="deliveryDate" className="flex flex-col gap-1.5">
            <Label>Deliver Ticket On</Label>
            <DatePicker
              value={deliveryDate}
              onChange={setDeliveryDate}
              minDate={todayDateOnly()}
              placeholder="Select delivery date"
              error={error}
            />
            {error && <FieldError>{error}</FieldError>}
          </div>
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
