'use client';

import { useState } from 'react';
import ServicePicker from './ServicePicker';

// A generic "Get started" that opens the service picker, for places that are
// not about one product (the hub hero and its final CTA).
export default function GetStartedButton({ className = 'btn btn--primary', label = 'Get started' }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {label}
      </button>
      <ServicePicker open={open} onClose={() => setOpen(false)} />
    </>
  );
}
