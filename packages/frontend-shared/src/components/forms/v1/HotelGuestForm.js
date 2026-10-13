'use client';

import { useEffect, useState } from 'react';
import { Loader2, User } from 'lucide-react';
import { useHotelContext } from '../../../contexts/HotelContext';
import { useCreateHotelBooking } from '../../../hooks/hotel-bookings/useCreateHotelBooking';
import { useCurrency } from '../../../contexts/CurrencyContext';
import SelectTitle from '../../form-elements/v1/SelectTitle';
import Input from '../../form-elements/v1/Input';
import Email from '../../form-elements/v1/Email';
import PhoneInput from '../../form-elements/v1/PhoneInput';
import Label from '../../form-elements/v1/Label';
import FieldError from '../../ui/v1/FieldError';

export default function HotelGuestForm({ offer, onAnalytics }) {
  const {
    cityName,
    countryCode,
    checkIn,
    checkOut,
    occupancy,
    guestNationality,
    guests,
    email,
    setEmail,
    phoneNumber,
    setPhoneNumber,
    setSelectedOffer,
    initializeGuests,
    updateGuestData,
    affiliateAttribution,
  } = useHotelContext();

  const { selectedCurrency } = useCurrency();
  const { createHotelBooking, isCreatingHotelBooking } = useCreateHotelBooking({ onAnalytics });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    initializeGuests(occupancy.rooms);
  }, [initializeGuests, occupancy.rooms]);

  function validate() {
    const next = {};
    guests.forEach((g, i) => {
      if (!g.title) next[`title-${i}`] = 'Required';
      if (!g.firstName?.trim()) next[`firstName-${i}`] = 'Required';
      if (!g.lastName?.trim()) next[`lastName-${i}`] = 'Required';
    });
    if (!/^\S+@\S+\.\S+$/.test(email || '')) next.email = 'Enter a valid email';
    if (!phoneNumber?.digits) next.phone = 'Enter a phone number';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!validate() || isCreatingHotelBooking) return;

    setSelectedOffer(offer);
    createHotelBooking({
      email,
      phoneNumber,
      guests,
      occupancy,
      guestNationality: guestNationality.toUpperCase(),
      destination: { cityName, countryCode },
      checkIn,
      checkOut,
      offerId: offer.offerId,
      hotelId: offer.hotelId,
      offerPrice: offer.price,
      hotel: offer.hotel,
      currency: selectedCurrency?.code,
      affiliateId: affiliateAttribution?.affiliateId,
      affiliateCapturedAt: affiliateAttribution?.capturedAt,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-4">
        {guests.map((guest, index) => (
          <div key={index} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                <User size={12} className="text-primary-700" />
              </div>
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Room {index + 1} guest{index === 0 ? ' (lead)' : ''}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[110px_1fr_1fr] gap-3">
              <div>
                <SelectTitle
                  value={guest.title}
                  onChange={(e) => updateGuestData(index, 'title', e.target.value)}
                />
                {errors[`title-${index}`] && <FieldError>{errors[`title-${index}`]}</FieldError>}
              </div>
              <div>
                <Input
                  type="text"
                  placeholder="First name"
                  value={guest.firstName}
                  onChange={(e) => updateGuestData(index, 'firstName', e.target.value)}
                />
                {errors[`firstName-${index}`] && <FieldError>{errors[`firstName-${index}`]}</FieldError>}
              </div>
              <div>
                <Input
                  type="text"
                  placeholder="Last name"
                  value={guest.lastName}
                  onChange={(e) => updateGuestData(index, 'lastName', e.target.value)}
                />
                {errors[`lastName-${index}`] && <FieldError>{errors[`lastName-${index}`]}</FieldError>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Email email={email} onChange={(e) => setEmail(e.target.value)} />
          {errors.email && <FieldError>{errors.email}</FieldError>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">Phone</Label>
          <PhoneInput value={phoneNumber} onChange={setPhoneNumber} inputId="phone" />
          {errors.phone && <FieldError>{errors.phone}</FieldError>}
        </div>
      </div>

      <button
        type="submit"
        disabled={isCreatingHotelBooking}
        className="w-full sm:w-auto sm:self-end inline-flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-600 disabled:opacity-40 text-white text-sm font-bold px-8 py-3.5 rounded-xl transition-colors"
      >
        {isCreatingHotelBooking && <Loader2 size={14} className="animate-spin" />}
        Continue to review
      </button>
    </form>
  );
}
