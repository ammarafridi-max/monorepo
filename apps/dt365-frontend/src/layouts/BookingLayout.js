'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Check, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const BOOKING_STEPS = [
  { id: 1, label: 'Select Flights', path: '/booking/select-flights' },
  { id: 2, label: 'Review Details', path: '/booking/review-details' },
  { id: 3, label: 'Payment',        path: '/booking/payment' },
];

export default function BookingLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900 font-sans mt-20">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <StepperDesktop />
        <StepperMobile />
      </div>
      <main className="flex-1 pb-24">
        <div className="w-[95%] lg:w-[70%] mx-auto py-6">{children}</div>
      </main>
    </div>
  );
}

function StepperDesktop() {
  const pathname = usePathname();
  const currentIndex = BOOKING_STEPS.findIndex((s) => s.path === pathname);

  return (
    <div className="hidden lg:flex items-center justify-center max-w-3xl mx-auto px-6 py-5">
      {BOOKING_STEPS.map((step, i) => {
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

            {i < BOOKING_STEPS.length - 1 && (
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

function StepperMobile() {
  const pathname = usePathname();
  const router   = useRouter();
  const currentIndex = BOOKING_STEPS.findIndex((s) => s.path === pathname);
  const currentStep  = BOOKING_STEPS[currentIndex];
  const previousStep = BOOKING_STEPS[currentIndex - 1];

  function goBack() {
    if (previousStep?.path) router.push(previousStep.path);
    else router.back();
  }

  return (
    <div className="flex lg:hidden items-center gap-4 px-6 py-4">
      <button
        type="button"
        onClick={goBack}
        disabled={currentIndex === 0}
        className="text-gray-600 hover:text-gray-900 disabled:text-gray-300 transition-colors shrink-0"
      >
        <ArrowLeft size={18} />
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 font-medium leading-none mb-0.5">
          Step {currentIndex + 1} of {BOOKING_STEPS.length}
        </p>
        <p className="text-sm font-bold text-gray-900 truncate">
          {currentStep?.label}
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {BOOKING_STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i < currentIndex  ? 'w-5 bg-primary-600' :
              i === currentIndex ? 'w-7 bg-gray-900'   :
                                   'w-5 bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
