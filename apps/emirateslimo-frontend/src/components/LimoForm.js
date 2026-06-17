'use client';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { useLimoBooking } from '@travel-suite/frontend-shared/contexts/LimoBookingContext';
import { trackLimoFormSubmission } from '../lib/analytics';
import { trackLimoFormSubmissionMeta } from '../lib/meta';
import toast from 'react-hot-toast';
import SearchLocations from './FormElements/SearchLocations';
import SelectDate from './FormElements/SelectDate';
import SelectTime from './FormElements/SelectTime';
import Button from './Button';
import SelectHours from './FormElements/SelectHours';

export default function LimoForm() {
  const { bookingData, setBookingData, submitLimoForm, isLoadingLimoForm } = useLimoBooking();
  const { tripType } = bookingData;
  const { register, handleSubmit, setValue, watch, reset } = useForm();

  function validateLimoForm(data) {
    if (!data?.pickup?.name) return 'Please select your pickup location.';
    if (tripType === 'distance' && !data?.dropoff?.name) return 'Please select your drop-off location.';
    if (tripType === 'hourly' && !data?.hoursBooked) return 'Please select how many hours you\u2019d like to book.';
    if (!data?.pickupDate) return 'Please select a pickup date.';
    if (!data?.pickupTime) return 'Please select a pickup time.';
    return null;
  }

  useEffect(() => {
    reset(bookingData);
  }, [bookingData, reset]);

  function onSubmit(data) {
    const error = validateLimoForm(data);
    if (error) return toast.error(error);
    trackLimoFormSubmission({
      tripType,
      pickup: `${data?.pickup?.name} - ${data?.pickup?.address}`,
      dropoff: tripType === 'distance' ? `${data?.dropoff?.name} - ${data?.dropoff?.address}` : null,
      pickupDate: data?.pickupDate,
      pickupTime: data?.pickupTime,
      hoursBooked: tripType === 'hourly' ? data?.hoursBooked : null,
    });
    trackLimoFormSubmissionMeta({ tripType });
    submitLimoForm(data);
  }

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm">
      <div className="flex p-1 rounded-t-2xl">
        {['distance', 'hourly'].map((type) => {
          const active = tripType === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => setBookingData((prev) => ({ ...prev, tripType: type }))}
              className={`
                w-1/2 text-center py-2.5 text-[15px] rounded-xl transition-all cursor-pointer
                ${active ? 'bg-primary-900/8 shadow-sm font-medium text-black' : 'text-gray-400 hover:text-black'}
              `}
            >
              {type === 'distance' ? 'Point-to-Point' : 'Hourly'}
            </button>
          );
        })}
      </div>

      <form className="flex flex-col gap-4 p-5 md:p-6" onSubmit={handleSubmit(onSubmit)}>
        <SearchLocations
          label="Pick-up location"
          register={register}
          setValue={setValue}
          watch={watch}
          name="pickup"
          placeholder="Search pickup address"
        />

        {tripType === 'distance' && (
          <SearchLocations
            label="Drop-off location"
            register={register}
            setValue={setValue}
            watch={watch}
            name="dropoff"
            placeholder="Search dropoff address"
          />
        )}

        {tripType === 'hourly' && (
          <SelectHours
            label="Duration"
            placeholder="Select hours"
            name="hoursBooked"
            register={register}
            setValue={setValue}
          />
        )}

        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <SelectDate
            label="Pick-up date"
            name="pickupDate"
            register={register}
            setValue={setValue}
            defaultValue={bookingData?.pickupDate}
          />
          <SelectTime
            label="Pick-up time"
            name="pickupTime"
            register={register}
            setValue={setValue}
            defaultValue={bookingData?.pickupTime}
          />
        </div>

        <Button
          type="submit"
          size="large"
          className="mt-1 font-normal tracking-wide"
          disabled={isLoadingLimoForm}
        >
          Select Your Vehicle
        </Button>
      </form>
    </div>
  );
}
