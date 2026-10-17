'use client';

import { useState } from 'react';
import ServicePicker from './ServicePicker';

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
