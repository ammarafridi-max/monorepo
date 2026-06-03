'use client';

import { useContext, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Car, Info } from 'lucide-react';
import { TransferBookingContext } from '@travel-suite/frontend-shared/contexts/TransferBookingContext';
import { createBookingApi } from '@travel-suite/frontend-shared/services/apiBookings';

const COUNTRY_CODES = [
  { code: '+971', name: 'UAE'       },
  { code: '+44',  name: 'UK'        },
  { code: '+1',   name: 'US / CA'   },
  { code: '+91',  name: 'India'     },
  { code: '+92',  name: 'Pakistan'  },
  { code: '+966', name: 'Saudi Arabia' },
  { code: '+968', name: 'Oman'      },
  { code: '+974', name: 'Qatar'     },
  { code: '+973', name: 'Bahrain'   },
  { code: '+20',  name: 'Egypt'     },
  { code: '+49',  name: 'Germany'   },
  { code: '+33',  name: 'France'    },
  { code: '+39',  name: 'Italy'     },
  { code: '+34',  name: 'Spain'     },
  { code: '+7',   name: 'Russia'    },
  { code: '+86',  name: 'China'     },
  { code: '+65',  name: 'Singapore' },
  { code: '+61',  name: 'Australia' },
  { code: '+81',  name: 'Japan'     },
];

const DEFAULT_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  countryCode: '+971',
  phone: '',
  flightNumber: '',
  specialRequests: '',
};

const inputBase =
  'w-full rounded-xl border bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-mute focus:bg-white focus:outline-none focus:ring-2 transition-colors';
const inputOk  = 'border-sand-300 focus:border-clay-500 focus:ring-clay-500/20';
const inputErr = 'border-red-300 focus:border-red-400 focus:ring-red-200';

const selectBase =
  'rounded-xl border border-sand-300 bg-white px-3 py-3 text-sm text-ink focus:border-clay-500 focus:outline-none focus:ring-2 focus:ring-clay-500/20 transition-colors';

function Field({ label, required, error, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-mute">
        {label}
        {required && <span className="ml-0.5 text-clay-500">*</span>}
      </span>
      {children}
      {hint && !error && (
        <p className="flex items-center gap-1 text-xs text-ink-mute">
          <Info size={11} className="shrink-0" />
          {hint}
        </p>
      )}
      {error && <p className="text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
}

function SectionHeader({ title, description }) {
  return (
    <div className="mt-8 mb-5">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {description && (
        <p className="mt-0.5 text-sm font-light text-ink-soft">{description}</p>
      )}
      <div className="mt-3 h-px bg-sand-200" />
    </div>
  );
}

function validate(data) {
  const errs = {};
  if (!data.firstName.trim())  errs.firstName  = 'First name is required';
  if (!data.lastName.trim())   errs.lastName   = 'Last name is required';
  if (!data.email.trim()) {
    errs.email = 'Email address is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errs.email = 'Please enter a valid email address';
  }
  if (!data.phone.trim())        errs.phone        = 'Phone number is required';
  if (!data.flightNumber.trim()) errs.flightNumber = 'Flight number is required';
  return errs;
}

export default function DetailsPage() {
  const {
    pickup, dropoff, date, time, passengers, luggage,
    selectedVehicle,
    passengerDetails, setPassengerDetails,
    setBookingId,
    registerPageAction, unregisterPageAction,
  } = useContext(TransferBookingContext);

  const [form, setForm]     = useState(() => passengerDetails ?? DEFAULT_FORM);
  const [errors, setErrors] = useState({});

  const formRef = useRef(form);
  useEffect(() => { formRef.current = form; }, [form]);

  const actionRef = useRef(null);
  actionRef.current = async () => {
    const data = formRef.current;
    const errs = validate(data);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return false;
    }
    setErrors({});
    setPassengerDetails(data);
    createBookingApi({
      trip:      { pickup, dropoff, date, time, passengers, luggage },
      vehicle:   selectedVehicle,
      passenger: data,
    })
      .then((result) => { if (result?._id) setBookingId(result._id); })
      .catch((err)   => { console.error('[booking] Save failed:', err); });
    return true;
  };

  useEffect(() => {
    registerPageAction(() => actionRef.current());
    return () => unregisterPageAction();
  }, [registerPageAction, unregisterPageAction]);

  if (!selectedVehicle) {
    return (
      <div className="py-20 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sand-200">
          <Car size={28} className="text-ink-mute" />
        </div>
        <h2 className="text-xl font-semibold text-ink">No vehicle selected</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm font-light leading-relaxed text-ink-soft">
          Please go back and select a vehicle before entering passenger details.
        </p>
        <Link
          href="/transfer-booking/select-vehicle"
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-clay-600 hover:text-clay-700"
        >
          <ArrowLeft size={14} />
          Back to vehicle selection
        </Link>
      </div>
    );
  }

  function set(field, transform) {
    return (e) => {
      const value = transform ? transform(e.target.value) : e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };
  }

  return (
    <>
      <h1 className="text-2xl font-semibold text-ink">Passenger details</h1>
      <p className="mt-1 text-sm font-light text-ink-soft">
        Your booking confirmation will be sent to the email address below.
      </p>

      <SectionHeader
        title="Lead passenger"
        description="The primary contact for this booking."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" required error={errors.firstName}>
          <input
            type="text"
            value={form.firstName}
            onChange={set('firstName')}
            placeholder="Jane"
            autoComplete="given-name"
            className={`${inputBase} ${errors.firstName ? inputErr : inputOk}`}
          />
        </Field>

        <Field label="Last name" required error={errors.lastName}>
          <input
            type="text"
            value={form.lastName}
            onChange={set('lastName')}
            placeholder="Smith"
            autoComplete="family-name"
            className={`${inputBase} ${errors.lastName ? inputErr : inputOk}`}
          />
        </Field>

        <Field label="Email address" required error={errors.email}>
          <input
            type="email"
            value={form.email}
            onChange={set('email')}
            placeholder="jane@example.com"
            autoComplete="email"
            className={`${inputBase} ${errors.email ? inputErr : inputOk}`}
          />
        </Field>

        <Field label="Phone number" required error={errors.phone}>
          <div className="flex gap-2">
            <select
              value={form.countryCode}
              onChange={set('countryCode')}
              className={`w-32 shrink-0 ${selectBase}`}
            >
              {COUNTRY_CODES.map(({ code, name }) => (
                <option key={code} value={code}>
                  {name} ({code})
                </option>
              ))}
            </select>
            <input
              type="tel"
              value={form.phone}
              onChange={set('phone')}
              placeholder="50 123 4567"
              autoComplete="tel-national"
              className={`min-w-0 flex-1 ${inputBase} ${errors.phone ? inputErr : inputOk}`}
            />
          </div>
        </Field>
      </div>

      <SectionHeader
        title="Flight information"
        description="Your driver tracks this flight so they're there when you land — even if you're delayed."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Flight number"
          required
          error={errors.flightNumber}
          hint="e.g. EK203, QR512, BA107"
        >
          <input
            type="text"
            value={form.flightNumber}
            onChange={set('flightNumber', (v) => v.toUpperCase())}
            placeholder="EK203"
            className={`${inputBase} ${errors.flightNumber ? inputErr : inputOk}`}
          />
        </Field>
      </div>

      <SectionHeader title="Special requests" />

      <Field hint="Child seat, accessibility needs, extra stops, preferred route, etc.">
        <textarea
          value={form.specialRequests}
          onChange={set('specialRequests')}
          rows={3}
          placeholder="e.g. Child seat needed for a 2-year-old, and we'll have two large suitcases."
          className={`resize-none ${inputBase} ${inputOk}`}
        />
      </Field>
    </>
  );
}
