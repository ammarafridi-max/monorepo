'use client';

import { useRouter } from 'next/navigation';
import VisaForm from '../../components/admin/v1/VisaForm.js';
import { useCreateVisa } from '../../hooks/visa/useCreateVisa.js';

export default function AdminNewVisaPage() {
  const router = useRouter();
  const { createVisa, isCreatingVisa } = useCreateVisa();

  function handleSubmit({ data, file }) {
    createVisa({ data, file }, {
      onSuccess: () => router.push('/admin/visa'),
    });
  }

  return <VisaForm onSubmit={handleSubmit} isPending={isCreatingVisa} />;
}
