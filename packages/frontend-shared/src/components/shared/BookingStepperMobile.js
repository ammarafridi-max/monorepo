'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Check, ChevronDown } from 'lucide-react';

export default function BookingStepperMobile({ steps = [] }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const currentIndex = steps.findIndex((s) => s.path === pathname);
  const currentStep = steps[currentIndex];

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  function goToStep(step, index) {
    if (index >= currentIndex) return;
    setOpen(false);
    router.push(step.path);
  }

  const headerRow = (
    <div className="flex items-center gap-4 px-6 py-4">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 font-medium leading-none mb-0.5">
          Step {currentIndex + 1} of {steps.length}
        </p>
        <p className="text-sm font-bold text-gray-900 truncate">{currentStep?.label}</p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i < currentIndex   ? 'w-5 bg-primary-600' :
              i === currentIndex ? 'w-7 bg-gray-900'   :
                                   'w-5 bg-gray-200'
            }`}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Hide steps' : 'Show steps'}
        className="shrink-0 text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ChevronDown size={18} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );

  return (
    <div className="lg:hidden relative">
      <div aria-hidden="true" className="invisible">{headerRow}</div>

      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      <div
        className={`absolute inset-x-0 top-0 bg-white overflow-hidden transition-all duration-300 ease-out ${
          open ? 'z-50 rounded-2xl shadow-xl' : 'z-10 rounded-none shadow-none'
        }`}
      >
        {headerRow}

        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-out ${
            open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
        >
          <div className="overflow-hidden">
            <div className="border-t border-gray-100">
              {steps.map((step, i) => {
                const isDone = i < currentIndex;
                const isCurrent = i === currentIndex;

                return (
                  <button
                    key={step.id ?? i}
                    type="button"
                    tabIndex={open ? 0 : -1}
                    onClick={() => goToStep(step, i)}
                    disabled={!isDone}
                    className={`w-full flex items-center gap-3 px-6 py-3.5 text-left border-b border-gray-50 last:border-0 transition-colors ${
                      isDone ? 'hover:bg-primary-50 cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                        isDone    ? 'bg-green-100 text-green-700' :
                        isCurrent ? 'bg-gray-900 text-white'      :
                                    'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {isDone ? <Check size={12} strokeWidth={3} /> : i + 1}
                    </span>

                    <span className={`flex-1 text-sm truncate ${
                      isCurrent ? 'font-bold text-gray-900' : isDone ? 'text-gray-700' : 'text-gray-400'
                    }`}>
                      {step.label}
                    </span>

                    {isDone && <span className="text-xs font-semibold text-primary-700 shrink-0">Edit</span>}
                    {isCurrent && <span className="text-xs font-medium text-gray-400 shrink-0">Current</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
