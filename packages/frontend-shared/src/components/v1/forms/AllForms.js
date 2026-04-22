'use client';

import { useState } from 'react';
import { Plane, ShieldPlus } from 'lucide-react';
import TicketForm from './TicketForm';
import TravelInsuranceForm from './TravelInsuranceForm';

const FORM_TABS = [
  { name: 'ticket', label: 'Ticket', Icon: Plane },
  { name: 'insurance', label: 'Travel Insurance', Icon: ShieldPlus },
];

export default function AllForms({ defaultTab = 'ticket' }) {
  const [activeForm, setActiveForm] = useState(defaultTab);

  return (
    <>
      <div className="flex lg:hidden items-center gap-3 mb-3 py-2 overflow-x-auto">
        {FORM_TABS.map(({ name, label, Icon }) => (
          <button
            key={name}
            type="button"
            onClick={() => setActiveForm(name)}
            className={`flex items-center gap-2 py-2 px-3 text-sm font-normal rounded-xl border-2 border-gray-100 cursor-pointer duration-300 ${
              activeForm === name
                ? 'bg-white border-primary-500'
                : 'bg-white hover:bg-gray-50'
            }`}
          >
            <span
            // className={`${activeForm === name ? 'text-primary-500' : ''}`}
            >
              <Icon size={18} />
            </span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {activeForm === 'ticket' && <TicketForm />}
      {activeForm === 'insurance' && <TravelInsuranceForm />}
    </>
  );
}
