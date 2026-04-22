'use client';
import { useMutation } from '@tanstack/react-query';
import { loginApi } from '../services/apiAuth.js';
import toast from 'react-hot-toast';

const ROLE_DEFAULT_PATH = {
  admin: '/admin',
  agent: '/admin/dummy-tickets',
  'blog-manager': '/admin/blog',
};

export function useLogin() {
  const { mutate: login, isPending: isLoggingIn } = useMutation({
    mutationFn: loginApi,
    onSuccess: () => {
      toast.success('Welcome back!');
    },
    onError: (err) => {
      toast.error(err.message || 'Invalid credentials');
    },
  });

  return {
    login,
    isLoggingIn,
    getDefaultAdminPath: (role) => ROLE_DEFAULT_PATH[role] || '/admin',
  };
}
