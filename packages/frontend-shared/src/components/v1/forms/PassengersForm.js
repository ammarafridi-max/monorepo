'use client';

import { useContext } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Mail,
  MapPin,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { InsuranceContext } from '../../../contexts/InsuranceContext.js';
import { useCreateInsuranceApplication } from '../../../hooks/insurance/useCreateInsuranceApplication';
import { useGetNationalities } from '../../../hooks/insurance/useGetNationalities';
import PhoneInput from '../form-elements/PhoneInput';
import DatePicker from '../form-elements/DatePicker';
import NationalitySelect from '../form-elements/NationalitySelect';

const TITLES = ['Mr', 'Mrs', 'Ms', 'Miss', 'Dr', 'Prof'];

const TYPE_CONFIG = {
  adults: {
    label: 'Adult',
    ageRange: 'Age 17 – 65',
    badge: 'bg-primary-50 text-primary-700 border-primary-200',
  },
  children: {
    label: 'Child',
    ageRange: 'Age 0 – 16',
    badge: 'bg-accent-50 text-accent-700 border-accent-200',
  },
  seniors: {
    label: 'Senior',
    ageRange: 'Age 66 – 75',
    badge: 'bg-gray-100 text-gray-600 border-gray-300',
  },
};

const inputCls =
  'border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full placeholder:text-gray-300';
const selectCls =
  'border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 w-full';

function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function dobBoundsForType(type) {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const pad = (yr) => `${yr}-${m}-${d}`;

  if (type === 'children') {
    // Age 0–16: born from today back to 17 years ago + 1 day
    return { minDate: pad(y - 16), maxDate: `${y}-${m}-${d}` };
  }
  if (type === 'seniors') {
    // Age 66–75: born between 75 and 66 years ago
    return { minDate: pad(y - 75), maxDate: pad(y - 66) };
  }
  // adults: Age 17–65
  return { minDate: pad(y - 65), maxDate: pad(y - 17) };
}

function PassengerCard({
  passenger,
  index,
  typeLabel,
  ageRange,
  isFirstAdult,
  passengerType,
  nationalities,
}) {
  const {
    handleUpdatePassenger,
    email,
    handleEmailChange,
    mobile,
    setMobile,
    streetAddress,
    handleStreetAddressChange,
    city,
    handleCityChange,
    country,
    handleCountryChange,
  } = useContext(InsuranceContext);

  const { minDate: dobMin, maxDate: dobMax } = dobBoundsForType(passengerType);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
          <User size={15} className="text-primary-700" />
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm">
            {typeLabel} {index + 1}
          </p>
          <p className="text-xs text-gray-400">{ageRange}</p>
        </div>
        {isFirstAdult && (
          <span className="ml-auto text-xs font-semibold bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full border border-primary-200">
            Primary Traveller
          </span>
        )}
      </div>

      <div className="p-6 flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-[110px_1fr_1fr] gap-4">
          <Field label="Title" required>
            <select
              required
              value={passenger.title}
              onChange={(e) =>
                handleUpdatePassenger(passenger.id, 'title', e.target.value)
              }
              className={selectCls}
            >
              {TITLES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="First Name" required>
            <input
              required
              type="text"
              placeholder="John"
              value={passenger.firstName}
              onChange={(e) =>
                handleUpdatePassenger(passenger.id, 'firstName', e.target.value)
              }
              className={inputCls}
            />
          </Field>
          <Field label="Last Name" required>
            <input
              required
              type="text"
              placeholder="Smith"
              value={passenger.lastName}
              onChange={(e) =>
                handleUpdatePassenger(passenger.id, 'lastName', e.target.value)
              }
              className={inputCls}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Nationality" required>
            <NationalitySelect
              required
              value={passenger.nationality}
              onChange={(nat) =>
                handleUpdatePassenger(passenger.id, 'nationality', nat)
              }
              nationalities={nationalities}
              inputClassName={inputCls}
            />
          </Field>
          <Field label="Date of Birth" required>
            <DatePicker
              value={passenger.dob}
              onChange={(v) => handleUpdatePassenger(passenger.id, 'dob', v)}
              placeholder="Select date of birth"
              minDate={dobMin}
              maxDate={dobMax}
              required
              inputClassName={inputCls}
            />
          </Field>
          <Field label="Passport Number" required>
            <input
              required
              type="text"
              placeholder="123456789"
              value={passenger.passport}
              onChange={(e) =>
                handleUpdatePassenger(passenger.id, 'passport', e.target.value)
              }
              className={inputCls}
            />
          </Field>
        </div>

        {isFirstAdult && (
          <>
            <div className="border-t border-gray-100 pt-6">
              <div className="flex items-center gap-2 mb-5">
                <Mail size={15} className="text-primary-600" />
                <p className="text-sm font-bold text-gray-900">
                  Contact Information
                </p>
                <span className="text-xs text-gray-400 ml-1">
                  — policy documents sent here
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Email Address" required>
                  <input
                    required
                    type="email"
                    placeholder="john.smith@example.com"
                    value={email}
                    onChange={handleEmailChange}
                    className={inputCls}
                  />
                </Field>
                <Field label="Phone Number" required>
                  <PhoneInput required value={mobile} onChange={setMobile} />
                </Field>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <div className="flex items-center gap-2 mb-5">
                <MapPin size={15} className="text-primary-600" />
                <p className="text-sm font-bold text-gray-900">Home Address</p>
              </div>
              <div className="flex flex-col gap-4">
                <Field label="Address" required>
                  <input
                    required
                    type="text"
                    placeholder="123 High Street, Apartment 4B"
                    value={streetAddress}
                    onChange={handleStreetAddressChange}
                    className={inputCls}
                  />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="City" required>
                    <input
                      required
                      type="text"
                      placeholder="London"
                      value={city}
                      onChange={handleCityChange}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Country" required>
                    <input
                      required
                      type="text"
                      placeholder="United Kingdom"
                      value={country}
                      onChange={handleCountryChange}
                      className={inputCls}
                    />
                  </Field>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PassengersForm() {
  const {
    quoteId,
    schemeId,
    journeyType,
    startDate,
    endDate,
    region,
    quantity,
    passengers,
    email,
    mobile,
    streetAddress,
    addressLine2,
    city,
    country,
    setSessionId,
  } = useContext(InsuranceContext);

  const router = useRouter();
  const { createInsuranceApplication, isCreatingApplication } =
    useCreateInsuranceApplication();
  const { nationalities = [] } = useGetNationalities();

  const grouped = [
    { key: 'adults', list: passengers.filter((p) => p.type === 'adults') },
    { key: 'children', list: passengers.filter((p) => p.type === 'children') },
    { key: 'seniors', list: passengers.filter((p) => p.type === 'seniors') },
  ].filter((g) => g.list.length > 0);

  const firstAdultId = passengers.find((p) => p.type === 'adults')?.id;

  function handleSubmit(e) {
    e.preventDefault();
    createInsuranceApplication(
      {
        quoteId,
        schemeId,
        journeyType,
        startDate,
        endDate,
        region,
        quantity,
        passengers,
        email,
        mobile,
        streetAddress,
        addressLine2,
        city,
        country,
      },
      {
        onSuccess: (data) => {
          setSessionId(data.sessionId);
          router.push('/insurance-booking/review');
        },
      },
    );
  }

  if (passengers.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-24 text-center">
        <ShieldCheck size={40} className="text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-6">
          No passengers found. Please start from the quote page.
        </p>
        <Link
          href="/"
          className="text-primary-700 font-semibold hover:underline"
        >
          ← Back to home
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900">
            Passenger Details
          </h1>
          <p className="text-sm text-gray-500 mt-1.5">
            Enter all names and dates exactly as they appear on each traveller's
            passport.
          </p>
        </div>

        <div className="flex flex-col gap-12">
          {grouped.map(({ key, list }) => {
            const config = TYPE_CONFIG[key];
            return (
              <section key={key}>
                <div className="flex items-center gap-3 mb-5">
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full border ${config.badge}`}
                  >
                    {config.label}s
                  </span>
                  <span className="text-xs text-gray-400">
                    {config.ageRange}
                  </span>
                </div>
                <div className="flex flex-col gap-5">
                  {list.map((passenger, index) => (
                    <PassengerCard
                      key={passenger.id}
                      passenger={passenger}
                      index={index}
                      typeLabel={config.label}
                      ageRange={config.ageRange}
                      isFirstAdult={passenger.id === firstAdultId}
                      passengerType={key}
                      nationalities={nationalities}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* <div className="mt-10 pt-8 border-t border-gray-200 flex items-center justify-between">
          <Link
            href="/insurance-booking/quote"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={15} />
            Back to quotes
          </Link>
          <button
            type="submit"
            disabled={isCreatingApplication}
            className="inline-flex items-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold px-8 py-3 rounded-xl transition-colors"
          >
            {isCreatingApplication ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Saving…
              </>
            ) : (
              <>
                Continue to Review
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </div> */}
      </div>
    </form>
  );
}
