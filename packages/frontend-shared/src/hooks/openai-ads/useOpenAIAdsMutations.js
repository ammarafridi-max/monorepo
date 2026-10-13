'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  createOpenAIAdApi,
  createOpenAIAdGroupApi,
  createOpenAICampaignApi,
  previewOpenAIAdApi,
  renameOpenAIAdsApi,
  updateOpenAIAdGroupSettingsApi,
  updateOpenAICampaignSettingsApi,
  setOpenAIAdsStatusApi,
  uploadOpenAIAdImageApi,
} from '../../services/apiOpenAIAds.js';

function useAdsMutation(mutationFn, successMessage) {
  const queryClient = useQueryClient();
  const { mutate, mutateAsync, isPending } = useMutation({
    mutationFn,
    onSuccess: (data) => {
      if (data?.warning) toast.error(data.warning, { duration: 8000 });
      else if (successMessage) toast.success(successMessage);
      queryClient.invalidateQueries({ queryKey: ['openai-ads'] });
    },
    onError: (err) => toast.error(err?.message || 'Something went wrong.'),
  });
  return { mutate, mutateAsync, isPending };
}

export const useSetOpenAIAdsStatus = () => useAdsMutation(setOpenAIAdsStatusApi, null);
export const useUpdateOpenAICampaignSettings = () => useAdsMutation(updateOpenAICampaignSettingsApi, 'Campaign settings saved.');
export const useUpdateOpenAIAdGroupSettings = () => useAdsMutation(updateOpenAIAdGroupSettingsApi, 'Ad group settings saved.');
export const useRenameOpenAIAds = () => useAdsMutation(renameOpenAIAdsApi, 'Name updated.');
export const useCreateOpenAICampaign = () => useAdsMutation(createOpenAICampaignApi, 'Campaign created. It is paused until you activate it.');
export const useCreateOpenAIAdGroup = () => useAdsMutation(createOpenAIAdGroupApi, 'Ad group created.');
export const useCreateOpenAIAd = () => useAdsMutation(createOpenAIAdApi, 'Ad created. OpenAI will review it.');

export function useUploadOpenAIAdImage() {
  const { mutateAsync, isPending } = useMutation({
    mutationFn: uploadOpenAIAdImageApi,
    onError: (err) => toast.error(err?.message || 'Image upload failed.'),
  });
  return { uploadImage: mutateAsync, isUploadingImage: isPending };
}

export function usePreviewOpenAIAd() {
  const { mutateAsync, isPending } = useMutation({
    mutationFn: previewOpenAIAdApi,
    onError: (err) => toast.error(err?.message || 'Preview failed.'),
  });
  return { previewAd: mutateAsync, isPreviewing: isPending };
}
