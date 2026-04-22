'use client';

import { useContext } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Check,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Calendar,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { InsuranceContext } from '@travel-suite/frontend-shared/contexts/InsuranceContext';
import { calcDays, formatPremium, parsePlanName } from '@travel-suite/frontend-shared/utils/insuranceHelpers';

export const INSURANCE_STEPS = [
  { id: 1, label: 'Choose Plan', path: '/insurance-booking/quote' },
  {
    id: 2,
    label: 'Passenger Details',
    path: '/insurance-booking/passengers',
  },
  { id: 3, label: 'Review', path: '/insurance-booking/review' },
  { id: 4, label: 'Payment', path: '/insurance-booking/payment' },
];

export default function InsuranceLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900 font-sans mt-20">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <StepperDesktop />
        <StepperMobile />
      </div>
      <TripSummaryBar />
      <main className="flex-1 pb-24">{children}</main>
      <BookingFooterConditional />
    </div>
  );
}

function TripSummaryBar() {
  const { journeyType, startDate, endDate, region, quantity } =
    useContext(InsuranceContext);

  const days = calcDays(journeyType, startDate, endDate);

  if (!startDate && !region?.name) return null;

  function formatDate(str) {
    if (!str) return '—';
    const d = new Date(str);
    if (isNaN(d)) return str;
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  const travellersLabel = [
    quantity.adults > 0 &&
      `${quantity.adults} Adult${quantity.adults > 1 ? 's' : ''}`,
    quantity.children > 0 &&
      `${quantity.children} Child${quantity.children > 1 ? 'ren' : ''}`,
    quantity.seniors > 0 &&
      `${quantity.seniors} Senior${quantity.seniors > 1 ? 's' : ''}`,
  ]
    .filter(Boolean)
    .join(', ');

  const TRIP_TYPE_LABELS = {
    single: 'Single Trip',
    annual: 'Annual Multi-Trip',
    biennial: 'Biennial Multi-Trip',
  };

  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-6 py-3 flex flex-wrap items-center gap-x-4 gap-y-1 justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
          {region?.name && (
            <div className="flex items-center gap-1.5">
              <MapPin size={13} className="text-primary-500 shrink-0" />
              <span className="font-medium">{region.name}</span>
            </div>
          )}
          {startDate && (
            <>
              <div className="w-px h-3.5 bg-gray-200 hidden sm:block" />
              <div className="flex items-center gap-1.5">
                <Calendar size={13} className="text-primary-500 shrink-0" />
                <span>
                  {journeyType === 'annual'
                    ? `Annual from ${formatDate(startDate)}`
                    : `${formatDate(startDate)} — ${formatDate(endDate)}`}
                </span>
              </div>
            </>
          )}
          {travellersLabel && (
            <>
              <div className="w-px h-3.5 bg-gray-200 hidden sm:block" />
              <div className="flex items-center gap-1.5">
                <Users size={13} className="text-primary-500 shrink-0" />
                <span>{travellersLabel}</span>
              </div>
            </>
          )}
          {startDate && (
            <>
              <div className="w-px h-3.5 bg-gray-200 hidden sm:block" />
              <span className="text-gray-400">
                {journeyType === 'annual'
                  ? 'Annual'
                  : journeyType === 'biennial'
                    ? 'Biennial'
                    : `${days} days`}
              </span>
            </>
          )}
          {journeyType && (
            <>
              <div className="w-px h-3.5 bg-gray-200 hidden sm:block" />
              <span className="bg-primary-50 text-primary-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {TRIP_TYPE_LABELS[journeyType] || 'Single Trip'}
              </span>
            </>
          )}
        </div>
        <Link
          href="/"
          className="text-xs font-semibold text-primary-600 hover:text-primary-800 border border-primary-200 hover:bg-primary-50 px-3 py-1 rounded-full transition-colors"
        >
          Edit search
        </Link>
      </div>
    </div>
  );
}

function BookingFooterConditional() {
  const pathname = usePathname();
  if (
    pathname === '/insurance-booking/review' ||
    pathname === '/insurance-booking/payment'
  )
    return null;
  return <BookingFooter />;
}

function BookingFooter() {
  const pathname = usePathname();
  const { passengers, selectedQuote } = useContext(InsuranceContext);

  const currentIndex = INSURANCE_STEPS.findIndex((s) => s.path === pathname);
  const nextStep = INSURANCE_STEPS[currentIndex + 1];

  const isDisabled = (() => {
    if (pathname === '/insurance-booking/quote') return !selectedQuote;
    if (pathname === '/insurance-booking/passengers')
      return passengers.length === 0 || !selectedQuote;
    return false;
  })();

  const isPassengersPage = pathname === '/insurance-booking/passengers';

  function handleContinue(e) {
    if (isDisabled) return;
    if (isPassengersPage) {
      e.preventDefault();
      const form = document.querySelector('form');
      if (form) form.requestSubmit();
    }
  }

  if (!nextStep) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 shadow-2xl">
      <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${selectedQuote ? 'bg-primary-100' : 'bg-gray-100'}`}
          >
            <ShieldCheck
              size={18}
              className={selectedQuote ? 'text-primary-700' : 'text-gray-400'}
            />
          </div>
          {selectedQuote ? (
            <div>
              <p className="text-xs text-gray-400 font-medium">Selected plan</p>
              <p className="text-sm font-bold text-gray-900">
                {parsePlanName(selectedQuote.name)}
                <span className="ml-2 text-primary-700 font-extrabold">
                  {selectedQuote.currency}{' '}
                  {formatPremium(selectedQuote.premium)}
                </span>
                <span className="ml-1 text-xs text-gray-400 font-normal">
                  total
                </span>
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xs text-gray-400 font-medium">
                No plan selected
              </p>
              <p className="text-sm font-semibold text-gray-500">
                Select a plan to continue
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            href={isDisabled || isPassengersPage ? '#' : nextStep.path}
            onClick={handleContinue}
            aria-disabled={isDisabled}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 text-sm font-bold px-8 py-3 rounded-xl transition-colors ${
              isDisabled
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-primary-700 hover:bg-primary-800 text-white'
            }`}
          >
            Continue <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function StepperDesktop() {
  const pathname = usePathname();
  const currentIndex = INSURANCE_STEPS.findIndex((s) => s.path === pathname);

  return (
    <div className="hidden lg:flex items-center justify-center max-w-3xl mx-auto px-6 py-5">
      {INSURANCE_STEPS.map((step, i) => {
        const isDone = i < currentIndex;
        const isActive = i === currentIndex;

        return (
          <div key={step.id} className="flex items-center">
            <Link
              href={isDone || isActive ? step.path : '#'}
              onClick={(e) => {
                if (!isDone && !isActive) e.preventDefault();
              }}
              className={`flex flex-col items-center gap-2 ${!isDone && !isActive ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
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
            </Link>

            {i < INSURANCE_STEPS.length - 1 && (
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
  const router = useRouter();
  const currentIndex = INSURANCE_STEPS.findIndex((s) => s.path === pathname);
  const currentStep = INSURANCE_STEPS[currentIndex];
  const previousStep = INSURANCE_STEPS[currentIndex - 1];

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
          Step {currentIndex + 1} of {INSURANCE_STEPS.length}
        </p>
        <p className="text-sm font-bold text-gray-900 truncate">
          {currentStep?.label}
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {INSURANCE_STEPS.map((_, i) => (
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
