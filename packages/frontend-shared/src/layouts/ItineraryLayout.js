'use client';

import { usePathname } from 'next/navigation';
import { Check } from 'lucide-react';
import Container from '../components/shared/layout/Container.js';

export const ITINERARY_STEPS = [
  { id: 1, label: 'Trip Details' },
  { id: 2, label: 'Preview & Pay' },
  { id: 3, label: 'Download' },
];

// The flow uses dynamic, session-scoped URLs (/itinerary-booking/<sessionId>),
// so we derive the active step from the path shape rather than an exact match.
function getStepIndex(pathname) {
  if (!pathname) return 0;
  if (pathname.endsWith('/form')) return 0;
  if (pathname.endsWith('/success')) return 2;
  if (pathname.startsWith('/itinerary-booking/')) return 1; // /itinerary-booking/<sessionId>
  return 0;
}

export default function ItineraryLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900 font-sans">
      <div className="bg-white border-b border-gray-200 shadow-sm mt-4">
        <StepperDesktop />
        <StepperMobile />
      </div>
      {/* pb leaves room for the fixed action bar on the preview step */}
      <main className="flex-1 pb-28">
        <Container className="py-6">{children}</Container>
      </main>
    </div>
  );
}

function StepperDesktop() {
  const pathname = usePathname();
  const currentIndex = getStepIndex(pathname);

  return (
    <div className="hidden lg:flex items-center justify-center max-w-3xl mx-auto px-6 py-5">
      {ITINERARY_STEPS.map((step, i) => {
        const isDone = i < currentIndex;
        const isActive = i === currentIndex;

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  isDone
                    ? 'bg-primary-700 text-white'
                    : isActive
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                {isDone ? <Check size={13} strokeWidth={3} /> : i + 1}
              </div>
              <span
                className={`text-xs font-semibold whitespace-nowrap transition-colors ${
                  isDone
                    ? 'text-primary-700'
                    : isActive
                      ? 'text-gray-900'
                      : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>

            {i < ITINERARY_STEPS.length - 1 && (
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
  const currentIndex = getStepIndex(pathname);
  const currentStep = ITINERARY_STEPS[currentIndex];

  return (
    <div className="flex lg:hidden items-center gap-4 px-6 py-4">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 font-medium leading-none mb-0.5">
          Step {currentIndex + 1} of {ITINERARY_STEPS.length}
        </p>
        <p className="text-sm font-bold text-gray-900 truncate">{currentStep?.label}</p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {ITINERARY_STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i < currentIndex
                ? 'w-5 bg-primary-600'
                : i === currentIndex
                  ? 'w-7 bg-gray-900'
                  : 'w-5 bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
