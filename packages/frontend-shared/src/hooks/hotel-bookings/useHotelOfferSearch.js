'use client';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { searchHotelOffersApi } from '../../services/apiHotelBookings.js';

export function useHotelOfferSearch({ onSuccess } = {}) {
  const { mutate: searchOffers, data: offers, isPending: isSearchingOffers, isError: isErrorOffers, error } =
    useMutation({
      mutationFn: searchHotelOffersApi,
      onSuccess,
      onError: (err) => toast.error(err.message),
    });

  return { searchOffers, offers, isSearchingOffers, isErrorOffers, error };
}
