'use client';

import { useAdminAuth } from '../../../contexts/AdminAuthContext';
import { useNewPaidOrderPing } from '../../../hooks/dummy-tickets/useNewPaidOrderPing';

// Headless: mounts the polling hook only when an admin is signed in.
// Renders nothing — it's just an effect host.
export default function NewOrderPinger() {
  const { isAdminAuthenticated } = useAdminAuth();
  useNewPaidOrderPing({ enabled: isAdminAuthenticated });
  return null;
}
