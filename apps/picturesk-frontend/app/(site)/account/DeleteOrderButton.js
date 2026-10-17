'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteOrderButton({ orderId }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (busy) return;
    if (!window.confirm('DEV: delete this order record? This cannot be undone.')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/account/orders/${orderId}`, { method: 'DELETE' });
      if (res.ok) {
        router.refresh();
        return;
      }
      setBusy(false);
    } catch {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className="ord__del"
      disabled={busy}
      onClick={onDelete}
      aria-label="Delete this order (dev)"
    >
      {busy ? 'Deleting' : 'Delete'}
    </button>
  );
}
