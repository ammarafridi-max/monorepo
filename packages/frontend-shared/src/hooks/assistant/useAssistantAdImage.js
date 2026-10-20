'use client';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { uploadAssistantAdImageApi } from '../../services/apiAssistant.js';

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export function useAssistantAdImage({ onUploaded } = {}) {
  const { mutate, isPending } = useMutation({
    mutationFn: uploadAssistantAdImageApi,
    onSuccess: (fileId, file) => {
      if (!fileId) {
        toast.error('The ad account did not return an image id');
        return;
      }
      onUploaded?.({ fileId, name: file.name });
    },
    onError: (error) => toast.error(error.message),
  });

  function uploadImage(file) {
    if (!file) return;
    if (!TYPES.includes(file.type)) {
      toast.error('Image must be PNG, JPG or WebP');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('Image must be 5 MB or smaller');
      return;
    }
    mutate(file);
  }

  return { uploadImage, uploadingImage: isPending };
}
