'use client';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { requestAdminOtpApi, verifyAdminOtpApi } from '../services/apiAuth.js';

const ROLE_DEFAULT_PATH = {
  admin: '/admin',
  agent: '/admin/dummy-tickets',
  'blog-manager': '/admin/blog',
};

export function useOtpLogin() {
  const { mutate: requestCode, isPending: isRequestingCode } = useMutation({
    mutationFn: requestAdminOtpApi,
    onError: (err) => toast.error(err.message || 'Could not send the code'),
  });

  const { mutate: verifyCode, isPending: isVerifyingCode } = useMutation({
    mutationFn: verifyAdminOtpApi,
    onSuccess: () => toast.success('Welcome back!'),
    onError: (err) => toast.error(err.message || 'Invalid or expired code'),
  });

  return {
    requestCode,
    isRequestingCode,
    verifyCode,
    isVerifyingCode,
    getDefaultAdminPath: (role) => ROLE_DEFAULT_PATH[role] || '/admin',
  };
}
