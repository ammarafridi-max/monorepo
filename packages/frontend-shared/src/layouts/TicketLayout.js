'use client';

import { usePathname } from 'next/navigation';
import { Check } from 'lucide-react';
import Link from 'next/link';
import BookingStepperMobile from '../components/shared/BookingStepperMobile.js';

const TICKET_STEPS = [
  { id: 1, label: 'Select Flights', path: '/booking/select-flights' },
  { id: 2, label: 'Review Details', path: '/booking/review-details' },
  { id: 3, label: 'Payment',        path: '/booking/payment' },
];

export default function TicketLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900 font-sans mt-17 lg:mt-20">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <StepperDesktop />
        <BookingStepperMobile steps={TICKET_STEPS} />
      </div>
      <main className="flex-1 pb-24">
        <div className="w-[95%] lg:w-[70%] mx-auto py-6">{children}</div>
      </main>
    </div>
  );
}

function StepperDesktop() {
  const pathname = usePathname();
  const currentIndex = TICKET_STEPS.findIndex((s) => s.path === pathname);

  return (
    <div className="hidden lg:flex items-center justify-center max-w-3xl mx-auto px-6 py-5">
      {TICKET_STEPS.map((step, i) => {
        const isDone   = i < currentIndex;
        const isActive = i === currentIndex;

        return (
          <div key={step.id} className="flex items-center">
            <Link
              href={isDone || isActive ? step.path : '#'}
              onClick={(e) => { if (!isDone && !isActive) e.preventDefault(); }}
              className={`flex flex-col items-center gap-2 ${!isDone && !isActive ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  isDone   ? 'bg-primary-700 text-white' :
                  isActive ? 'bg-gray-900 text-white'   :
                             'bg-gray-100 text-gray-400'
                }`}
              >
                {isDone ? <Check size={13} strokeWidth={3} /> : i + 1}
              </div>
              <span
                className={`text-xs font-semibold whitespace-nowrap transition-colors ${
                  isDone   ? 'text-primary-700' :
                  isActive ? 'text-gray-900'    :
                             'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </Link>

            {i < TICKET_STEPS.length - 1 && (
              <div
                className={`w-24 h-px mb-4 mx-3 transition-colors ${i < currentIndex ? 'bg-primary-300' : 'bg-gray-200'}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
