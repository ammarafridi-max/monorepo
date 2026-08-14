'use client';

import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { useNewPaidOrderPing } from '../../hooks/dummy-tickets/useNewPaidOrderPing';

export default function NewOrderPinger() {
  const { isAdminAuthenticated } = useAdminAuth();
  useNewPaidOrderPing({ enabled: isAdminAuthenticated });
  return null;
}
