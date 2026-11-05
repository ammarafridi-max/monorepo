'use client';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { searchHotelsApi } from '../../services/apiHotelBookings.js';

export function useHotelSearch({ onSuccess } = {}) {
  const { mutate: searchHotels, data: hotels, isPending: isSearchingHotels, isError: isErrorHotels, error } =
    useMutation({
      mutationFn: searchHotelsApi,
      onSuccess,
      onError: (err) => toast.error(err.message),
    });

  return { searchHotels, hotels, isSearchingHotels, isErrorHotels, error };
}
