'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Plane, ShieldPlus, BedDouble } from 'lucide-react';

const FormFallback = () => (
  <div className="min-h-[420px] w-full animate-pulse rounded-3xl bg-white/10" />
);
const TicketForm = dynamic(() => import('./TicketForm'), {
  loading: FormFallback,
});
const TravelInsuranceForm = dynamic(() => import('./TravelInsuranceForm'), {
  loading: FormFallback,
});
const HotelForm = dynamic(() => import('./HotelForm'), {
  loading: FormFallback,
});

const ALL_TABS = [
  { name: 'ticket', label: 'Ticket', Icon: Plane },
  { name: 'hotel', label: 'Hotel', Icon: BedDouble },
  { name: 'insurance', label: 'Travel Insurance', Icon: ShieldPlus },
];

export default function AllForms({ forms = ['ticket', 'insurance'], defaultTab }) {
  const tabs = ALL_TABS.filter(({ name }) => forms.includes(name));
  const [activeForm, setActiveForm] = useState(defaultTab ?? forms[0]);

  if (tabs.length === 1) {
    return (
      <>
        {activeForm === 'ticket' && <TicketForm />}
        {activeForm === 'hotel' && <HotelForm />}
        {activeForm === 'insurance' && <TravelInsuranceForm />}
      </>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-3 py-2 overflow-x-auto">
        {tabs.map(({ name, label, Icon }) => (
          <button
            key={name}
            type="button"
            onClick={() => setActiveForm(name)}
            aria-pressed={activeForm === name}
            className={`flex items-center gap-1.5 py-1.5 px-3 text-[13px] rounded-lg cursor-pointer transition-colors duration-200 ${
              activeForm === name
                ? 'bg-accent-500 text-white font-semibold shadow-md'
                : 'bg-white text-primary-800 font-medium hover:bg-primary-50'
            }`}
          >
            <Icon size={15} className="shrink-0" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {activeForm === 'ticket' && <TicketForm />}
      {activeForm === 'hotel' && <HotelForm />}
      {activeForm === 'insurance' && <TravelInsuranceForm />}
    </>
  );
}
