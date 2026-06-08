'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { bookingSteps } from '../data/bookingSteps';
import { FaCheck } from 'react-icons/fa6';
import { HiArrowLeft } from 'react-icons/hi2';

export function BookingStepsLg() {
  const pathname = usePathname();

  return (
    <>
      <div className="hidden lg:flex justify-center gap-15 mx-auto z-50">
        {bookingSteps.map((item, i) => {
          const currentStepIndex = bookingSteps.findIndex((step) => step.page === pathname);
          const isCompleted = i < currentStepIndex;
          const isActive = i === currentStepIndex;

          return (
            <Link
              key={i}
              onClick={(e) => {
                if (!isCompleted && !isActive) e.preventDefault();
              }}
              href={item.page}
              className={`flex flex-col items-center gap-2 ${!isCompleted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span
                className={`w-8 h-8 text-sm flex items-center justify-center rounded-full transition-colors ${
                  isActive
                    ? 'bg-black text-white'
                    : isCompleted
                      ? 'bg-green-600 text-white'
                      : 'bg-primary-100 text-primary-400'
                }`}
              >
                {isCompleted ? <FaCheck /> : i + 1}
              </span>
              <span
                className={`text-sm ${
                  isActive ? 'text-black font-medium' : isCompleted ? 'text-primary-900' : 'text-primary-300'
                }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}

export function BookingStepsSm() {
  const router = useRouter();
  const pathname = usePathname();
  const currentStepIndex = bookingSteps.findIndex((step) => step.page === pathname);
  const currentStep = bookingSteps[currentStepIndex];
  const previousStep = bookingSteps[currentStepIndex - 1];

  return (
    <div className="flex lg:hidden items-center justify-start gap-3">
      <button
        type="button"
        className="disabled:text-primary-300"
        onClick={() => {
          if (previousStep?.page) {
            router.push(previousStep?.page);
          } else {
            router.back();
          }
        }}
      >
        <HiArrowLeft size={20} />
      </button>

      <span className="text-md font-light">
        {currentStepIndex + 1} of 3 - {currentStep?.name}
      </span>

      <span className="w-6" />
    </div>
  );
}
