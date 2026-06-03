'use client';

import { useContext } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Check,
  Car,
  MapPin,
  Calendar,
  Clock,
  Users,
  Briefcase,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import Container from '@travel-suite/frontend-shared/components/shared/layout/Container';
import { TransferBookingContext } from '@travel-suite/frontend-shared/contexts/TransferBookingContext';

export const TRANSFER_STEPS = [
  { id: 1, label: 'Select vehicle', path: '/transfer-booking/select-vehicle' },
  { id: 2, label: 'Details',        path: '/transfer-booking/details' },
  { id: 3, label: 'Review',         path: '/transfer-booking/review' },
  { id: 4, label: 'Payment',        path: '/transfer-booking/payment' },
];

function formatDate(str) {
  if (!str) return '';
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(str) {
  if (!str) return '';
  const [h, min] = str.split(':').map(Number);
  const period = h < 12 ? 'AM' : 'PM';
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:${String(min).padStart(2, '0')} ${period}`;
}

function TripSummary({ pickup, dropoff, date, time, passengers, luggage }) {
  return (
    <div className="space-y-2.5 text-xs text-ink-soft">
      <div className="flex items-start gap-1.5">
        <MapPin size={12} className="mt-0.5 shrink-0 text-clay-600" />
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{pickup?.label}</p>
          <p className="truncate text-ink-mute">→ {dropoff?.label}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span className="flex items-center gap-1">
          <Calendar size={11} className="shrink-0 text-clay-600" />
          {formatDate(date)}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={11} className="shrink-0 text-clay-600" />
          {formatTime(time)}
        </span>
      </div>
      <div className="flex gap-4">
        <span className="flex items-center gap-1">
          <Users size={11} className="shrink-0 text-clay-600" />
          {passengers} {passengers === 1 ? 'passenger' : 'passengers'}
        </span>
        <span className="flex items-center gap-1">
          <Briefcase size={11} className="shrink-0 text-clay-600" />
          {luggage} {luggage === 1 ? 'bag' : 'bags'}
        </span>
      </div>
    </div>
  );
}

function SelectionBox({ vehicle, pickup, dropoff, date, time, passengers, luggage, onContinue, continueLabel, isLoading }) {
  if (!vehicle) {
    return (
      <div className="rounded-card bg-white p-6 ring-1 ring-sand-300/60">
        <div className="py-4 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-sand-100">
            <Car size={22} className="text-ink-mute" />
          </div>
          <p className="text-sm font-semibold text-ink">Select a vehicle</p>
          <p className="mt-1 text-xs text-ink-mute">to see your booking summary</p>
        </div>

        <hr className="my-4 border-sand-200" />

        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-mute">
          Your trip
        </p>
        <TripSummary
          pickup={pickup}
          dropoff={dropoff}
          date={date}
          time={time}
          passengers={passengers}
          luggage={luggage}
        />

        <button
          disabled
          className="mt-5 w-full cursor-not-allowed rounded-xl bg-sand-200 py-3 text-sm font-semibold text-ink-mute"
        >
          {continueLabel}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-card bg-white p-6 ring-1 ring-clay-300 shadow-warm-sm">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-mute">
        Your selection
      </p>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-ink">{vehicle.name}</p>
          <p className="text-xs text-ink-mute">{vehicle.class}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xl font-bold text-ink">
            {vehicle.price.currency} {vehicle.price.amount}
          </p>
          <p className="text-[11px] text-ink-mute">fixed price</p>
        </div>
      </div>

      <ul className="mt-3 space-y-1.5">
        {vehicle.features.slice(0, 3).map((f) => (
          <li key={f} className="flex items-center gap-1.5 text-xs text-ink-soft">
            <Check size={11} className="shrink-0 text-clay-500" />
            {f}
          </li>
        ))}
      </ul>

      <hr className="my-4 border-sand-200" />

      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-mute">
        Your trip
      </p>
      <TripSummary
        pickup={pickup}
        dropoff={dropoff}
        date={date}
        time={time}
        passengers={passengers}
        luggage={luggage}
      />

      <button
        type="button"
        onClick={onContinue}
        disabled={isLoading}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-clay-600 py-3.5 text-sm font-semibold text-white shadow-warm-sm transition-colors hover:bg-clay-700 disabled:cursor-wait disabled:opacity-70"
      >
        {isLoading ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <>
            {continueLabel}
            <ArrowRight size={15} />
          </>
        )}
      </button>
    </div>
  );
}

function MobileBar({ vehicle, onContinue, continueLabel, isLoading }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-sand-200 bg-white shadow-warm lg:hidden">
      <Container>
        <div className="flex items-center justify-between gap-4 py-3.5">
          {vehicle ? (
            <>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{vehicle.name}</p>
                <p className="text-sm font-bold text-clay-600">
                  {vehicle.price.currency} {vehicle.price.amount}
                  <span className="ml-1 text-xs font-normal text-ink-mute">fixed</span>
                </p>
              </div>
              <button
                type="button"
                onClick={onContinue}
                disabled={isLoading}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-clay-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-clay-700 disabled:cursor-wait disabled:opacity-70"
              >
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : continueLabel}
                {!isLoading && <ArrowRight size={14} />}
              </button>
            </>
          ) : (
            <p className="w-full text-center text-sm text-ink-mute">
              Select a vehicle to continue
            </p>
          )}
        </div>
      </Container>
    </div>
  );
}

export default function TransferBookingLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { pickup, dropoff, date, time, passengers, luggage, selectedVehicle, callPageAction, isPageActionRunning } =
    useContext(TransferBookingContext);

  const currentIndex = TRANSFER_STEPS.findIndex((s) => s.path === pathname);
  const nextStep = TRANSFER_STEPS[currentIndex + 1];
  const continueLabel = nextStep
    ? `Continue to ${nextStep.label.toLowerCase()}`
    : 'Continue';

  async function handleContinue() {
    const ok = await callPageAction();
    if (!ok) return;
    if (nextStep) router.push(nextStep.path);
  }

  return (
    <div className="flex min-h-screen flex-col bg-sand-50 text-ink">
      <div className="border-b border-sand-200 bg-white shadow-warm-sm">
        <StepperDesktop currentIndex={currentIndex} />
        <StepperMobile currentIndex={currentIndex} />
      </div>
      <main className="flex-1 pb-24 lg:pb-0">
        <Container className="py-8 md:py-12">
          <div className="flex items-start gap-8">
            <div className="min-w-0 flex-1">{children}</div>
            <div className="hidden w-80 shrink-0 lg:block">
              <div className="sticky top-8">
                <SelectionBox
                  vehicle={selectedVehicle}
                  pickup={pickup}
                  dropoff={dropoff}
                  date={date}
                  time={time}
                  passengers={passengers}
                  luggage={luggage}
                  onContinue={handleContinue}
                  continueLabel={continueLabel}
                  isLoading={isPageActionRunning}
                />
              </div>
            </div>
          </div>
        </Container>
      </main>
      <MobileBar
        vehicle={selectedVehicle}
        onContinue={handleContinue}
        continueLabel="Continue"
        isLoading={isPageActionRunning}
      />
    </div>
  );
}

function StepperDesktop({ currentIndex }) {
  return (
    <div className="mx-auto hidden max-w-3xl items-center justify-center px-6 py-5 lg:flex">
      {TRANSFER_STEPS.map((step, i) => {
        const isDone   = i < currentIndex;
        const isActive = i === currentIndex;

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-2">
              <div
                className={[
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors',
                  isDone   ? 'bg-clay-600 text-white'  :
                  isActive ? 'bg-ink text-white'        :
                             'bg-sand-200 text-ink-mute',
                ].join(' ')}
              >
                {isDone ? <Check size={13} strokeWidth={3} /> : i + 1}
              </div>
              <span
                className={[
                  'whitespace-nowrap text-xs font-semibold transition-colors',
                  isDone   ? 'text-clay-600' :
                  isActive ? 'text-ink'       :
                             'text-ink-mute',
                ].join(' ')}
              >
                {step.label}
              </span>
            </div>

            {i < TRANSFER_STEPS.length - 1 && (
              <div
                className={[
                  'mx-2 mb-5 h-px w-12 transition-colors',
                  i < currentIndex ? 'bg-clay-300' : 'bg-sand-300',
                ].join(' ')}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StepperMobile({ currentIndex }) {
  const currentStep = TRANSFER_STEPS[currentIndex];

  return (
    <div className="flex items-center gap-4 px-6 py-4 lg:hidden">
      <div className="min-w-0 flex-1">
        <p className="mb-0.5 text-xs font-medium leading-none text-ink-mute">
          Step {currentIndex + 1} of {TRANSFER_STEPS.length}
        </p>
        <p className="truncate text-sm font-bold text-ink">
          {currentStep?.label ?? ''}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {TRANSFER_STEPS.map((_, i) => (
          <div
            key={i}
            className={[
              'h-1.5 rounded-full transition-all duration-300',
              i < currentIndex   ? 'w-5 bg-clay-600' :
              i === currentIndex ? 'w-7 bg-ink'       :
                                   'w-5 bg-sand-300',
            ].join(' ')}
          />
        ))}
      </div>
    </div>
  );
}
