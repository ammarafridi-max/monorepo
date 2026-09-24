'use client';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { forgotAdminPasswordApi, resetAdminPasswordApi } from '../services/apiAuth.js';

const ROLE_DEFAULT_PATH = {
  admin: '/admin',
  agent: '/admin/dummy-tickets',
  'blog-manager': '/admin/blog',
};

export function usePasswordReset() {
  const { mutate: requestReset, isPending: isRequestingReset } = useMutation({
    mutationFn: forgotAdminPasswordApi,
    onError: (err) => toast.error(err.message || 'Could not send the reset code'),
  });

  const { mutate: resetPassword, isPending: isResettingPassword } = useMutation({
    mutationFn: resetAdminPasswordApi,
    onSuccess: () => toast.success('Password updated. You are signed in.'),
    onError: (err) => toast.error(err.message || 'Invalid or expired code'),
  });

  return {
    requestReset,
    isRequestingReset,
    resetPassword,
    isResettingPassword,
    getDefaultAdminPath: (role) => ROLE_DEFAULT_PATH[role] || '/admin',
  };
}
