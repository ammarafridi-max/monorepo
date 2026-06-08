'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGetZoneByAddress } from '@/hooks/zones/useGetZoneByAddress';
import { useGetDistance } from '@/hooks/locations/useGetDistance';
import { CurrencyContext } from './CurrencyContext';
import { useLocalStorage } from '@/hooks/general/useLocalStorage';
import toast from 'react-hot-toast';

export const BookingContext = createContext();

export default function BookingProvider({ children }) {
  const router = useRouter();
  const [isLoadingLimoForm, setIsLoadingLimoForm] = useState(false);
  const { getZoneByAddress } = useGetZoneByAddress();
  const { getDistance } = useGetDistance();
  const { updateLocalStorage, deleteLocalStorage } = useLocalStorage();
  const { currency } = useContext(CurrencyContext);

  const initialBookingData = {
    tripType: 'distance',
    bookingRef: '',
    pickup: {
      id: '',
      zone: '',
      name: '',
      address: '',
      lat: '',
      lng: '',
      type: '',
    },
    dropoff: {
      id: '',
      zone: '',
      name: '',
      address: '',
      lat: '',
      lng: '',
      type: '',
    },
    pickupDate: '',
    pickupTime: '',
    vehicle: '',
    hoursBooked: 1,
    bookingDetails: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: { code: '+971', number: '' },
      flightNumber: '',
      arrivalTime: '',
      message: '',
    },
    payment: {
      method: 'stripe',
      status: 'unpaid',
      amount: 0,
      currency: currency?.code?.toLowerCase(),
      transactionId: '',
    },
    orderSummary: {
      baseFare: 0,
      distanceCharge: 0,
      hourlyCharge: 0,
      addOns: 0,
      taxes: 0,
      total: 0,
      currency: currency?.code,
      conversionRate: currency?.conversionRate,
    },
  };

  const [bookingData, setBookingData] = useState(() => {
    if (typeof window === 'undefined') return initialBookingData;
    const stored = JSON.parse(localStorage.getItem('bookingData'));
    return stored ? { ...initialBookingData, ...stored } : initialBookingData;
  });
  const isAirportTransfer =
    bookingData?.pickup?.type === 'airport' ||
    bookingData?.dropoff?.type === 'airport';

  async function submitLimoForm(data) {
    try {
      setIsLoadingLimoForm(true);

      const pickupZone = await getZoneByAddress({
        lat: data.pickup.lat,
        lng: data.pickup.lng,
      });

      let dropoffZone = null;
      let distance = null;

      if (
        bookingData?.tripType === 'distance' &&
        data.dropoff?.lat &&
        data.dropoff?.lng
      ) {
        data.hoursBooked = null;
        dropoffZone = await getZoneByAddress({
          lat: data.dropoff.lat,
          lng: data.dropoff.lng,
        });

        distance = await getDistance({
          originLat: data?.pickup?.lat,
          originLng: data?.pickup?.lng,
          destLat: data?.dropoff?.lat,
          destLng: data?.dropoff?.lng,
        });
      }

      if (bookingData?.tripType === 'hourly') {
        data.dropoff = null;
        data.distance = null;
        data.tripDuration = null;
      }

      if (!pickupZone) {
        toast.error('Pickup location not covered.');
        return;
      }

      deleteLocalStorage('bookingData');

      setBookingData((prev) => {
        const updated = {
          ...prev,
          pickup: {
            ...data.pickup,
            zone: pickupZone?._id || null,
          },
          dropoff: data.dropoff
            ? {
                ...data.dropoff,
                zone: dropoffZone?._id || null,
              }
            : null,
          pickupDate: data.pickupDate,
          pickupTime: data.pickupTime,
          hoursBooked:
            bookingData?.tripType === 'hourly' ? data?.hoursBooked : null,
          distance: distance?.distanceKm || null,
          tripDuration: distance?.durationMin || null,
          vehicle: '',
          payment: {
            ...prev.payment,
            amount: 0,
            currency: currency?.code?.toLowerCase(),
            transactionId: '',
            status: 'unpaid',
          },
          orderSummary: {
            ...prev.orderSummary,
            baseFare: 0,
            distanceCharge: 0,
            hourlyCharge: 0,
            addOns: 0,
            taxes: 0,
            total: 0,
            currency: currency?.code?.toLowerCase(),
            conversionRate: currency?.conversionRate,
          },
        };
        updateLocalStorage('bookingData', updated);
        return updated;
      });

      router.push('/book/select-limo');
    } catch (err) {
      toast.dismiss();
      console.error(err);
      toast.error('Something went wrong fetching zones.');
    } finally {
      setIsLoadingLimoForm(false);
    }
  }

  function handleChange(field, value) {
    setBookingData((prev) => ({
      ...prev,
      bookingDetails: {
        ...prev.bookingDetails,
        [field]: value,
      },
    }));
  }

  function handleNumberChange(field, value) {
    setBookingData((prev) => ({
      ...prev,
      bookingDetails: {
        ...prev.bookingDetails,
        phoneNumber: {
          ...prev.bookingDetails.phoneNumber,
          [field]: value,
        },
      },
    }));
  }

  function handleSelectVehicle(vehicle) {
    setBookingData((prev) => {
      const updated = {
        ...prev,
        vehicle: vehicle?.id,
        orderSummary: {
          ...prev.orderSummary,
          baseFare: currency?.conversionRate * vehicle?.totalPrice,
          currency: currency?.code?.toLowerCase(),
          conversionRate: currency?.conversionRate,
        },
      };
      updateLocalStorage('bookingData', updated);
      return updated;
    });
  }

  function handleSelectPaymentMethod(method) {
    setBookingData((prev) => {
      const updated = {
        ...prev,
        payment: {
          ...prev.payment,
          method,
        },
      };
      updateLocalStorage('bookingData', updated);
      return updated;
    });
  }

  useEffect(() => {
    setBookingData((prev) => {
      const { baseFare = 0, addOns = 0, taxes = 0 } = prev.orderSummary;
      const total =
        parseFloat(baseFare) + parseFloat(addOns) + parseFloat(taxes);

      return {
        ...prev,
        orderSummary: {
          ...prev.orderSummary,
          total,
        },
      };
    });
  }, [
    bookingData.orderSummary.baseFare,
    bookingData.orderSummary.addOns,
    bookingData.orderSummary.taxes,
  ]);

  useEffect(() => {
    setBookingData((prev) => {
      if (!prev?.orderSummary?.baseFare) return prev;
      if (prev.orderSummary.conversionRate === currency.conversionRate)
        return prev;
      const oldRate = prev.orderSummary.conversionRate || 1;

      return {
        ...prev,
        payment: {
          ...prev.payment,
          currency: currency?.code?.toLowerCase(),
        },
        orderSummary: {
          ...prev.orderSummary,
          baseFare:
            (prev.orderSummary.baseFare / oldRate) * currency.conversionRate,
          currency: currency?.code?.toLowerCase(),
          conversionRate: currency.conversionRate,
        },
      };
    });
  }, [currency]);

  return (
    <BookingContext.Provider
      value={{
        bookingData,
        setBookingData,
        isLoadingLimoForm,
        isAirportTransfer,
        handleChange,
        handleNumberChange,
        handleSelectVehicle,
        handleSelectPaymentMethod,
        submitLimoForm,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}
