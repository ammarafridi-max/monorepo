'use client';
import { useMutation } from '@tanstack/react-query';
import { setAdminUserPasswordApi } from '../../services/apiAdminUsers.js';
import toast from 'react-hot-toast';

export function useSetAdminUserPassword() {
  const { mutate: setPassword, isPending: isSettingPassword } = useMutation({
    mutationFn: ({ username, passwordData }) => setAdminUserPasswordApi(username, passwordData),
    onSuccess: () => {
      toast.success('Password updated successfully');
    },
    onError: (err) => {
      toast.error(err.message || 'Password could not be updated');
    },
  });

  return { setPassword, isSettingPassword };
}
