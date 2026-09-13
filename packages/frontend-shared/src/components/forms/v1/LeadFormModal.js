'use client';

import { useEffect, useRef, useState } from 'react';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { useForm } from 'react-hook-form';
import { X, Loader2, CheckCircle2 } from 'lucide-react';
import { useCreateVisaLead } from '../../../hooks/visa-leads/useCreateVisaLead.js';
import { NATIONALITIES } from '../../../data/nationalities.js';
import { trackVisaLeadSubmit } from '../../../utils/analytics.js';
import NationalitySelect from '../../form-elements/v1/NationalitySelect.js';
import PhoneInput from '../../form-elements/v1/PhoneInput.js';

const INPUT_CLS =
  'border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full placeholder:text-gray-300';

function Field({ label, error, required, htmlFor, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-500 mt-0.5">{error}</p>
      )}
    </div>
  );
}

function SuccessState({ firstName, onClose }) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-10 gap-5">
      <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
        <CheckCircle2 size={32} className="text-green-500" />
      </div>
      <div>
        <h3 className="font-outfit font-semibold text-[20px] text-gray-900 mb-2">
          Thanks, {firstName}! We&rsquo;ve got your details.
        </h3>
        <p className="font-outfit font-light text-[15px] text-gray-600 leading-7 max-w-sm">
          Our rep will call you within a few minutes during business hours.
          If you submitted outside business hours, expect a call first thing tomorrow.
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="mt-2 text-sm font-outfit font-medium text-primary-600 hover:text-primary-700 underline underline-offset-2 transition-colors"
      >
        Close
      </button>
    </div>
  );
}

export default function LeadFormModal({ isOpen, onClose, visa, defaultPackage = 'undecided', source = 'hero_cta', whatsappUrl = '' }) {
  const [success, setSuccess] = useState(false);
  const [submittedFirstName, setSubmittedFirstName] = useState('');
  const [submittedNationality, setSubmittedNationality] = useState('');
  const [serverError, setServerError] = useState(null);

  const { createVisaLeadAsync, isSubmittingLead } = useCreateVisaLead();
  const firstFieldRef = useRef(null);
  const openerRef = useRef(null);
  const nationalities = NATIONALITIES;

  const packages = visa?.packages ?? [];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isDirty },
    reset,
  } = useForm({
    defaultValues: {
      firstName:        '',
      lastName:         '',
      nationality:      null,
      email:            '',
      phone:            { code: '+971', digits: '' },
      packageRequested: defaultPackage || 'undecided',
      applicantCount:   1,
      website:          '',
    },
  });

  const nationalityValue = watch('nationality');
  const phoneValue = watch('phone');

  useEffect(() => {
    if (isOpen) {
      reset({
        firstName:        '',
        lastName:         '',
        nationality:      null,
        email:            '',
        phone:            { code: '+971', digits: '' },
        packageRequested: defaultPackage || 'undecided',
        applicantCount:   1,
        website:          '',
      });
      setSuccess(false);
      setServerError(null);
    }
  }, [isOpen, defaultPackage, reset]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      openerRef.current = document.activeElement;
      setTimeout(() => firstFieldRef.current?.focus(), 0);
    } else {
      document.body.style.overflow = '';
      openerRef.current?.focus?.();
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key !== 'Escape') return;
      if (isDirty) {

        if (window.confirm('You have unsaved changes. Discard?')) onClose();
      } else {
        onClose();
      }
    }
    if (isOpen) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDirty, onClose]);

  function handleBackdropClick() {
    if (isDirty) {

      if (window.confirm('You have unsaved changes. Discard?')) onClose();
    } else {
      onClose();
    }
  }

  async function onFormSubmit(data) {
    setServerError(null);

    const phone = `${data.phone?.code || ''}${data.phone?.digits || ''}`.trim();

    const nationality = data.nationality?.nationality || '';

    const payload = {
      firstName:        data.firstName,
      lastName:         data.lastName,
      nationality,
      email:            data.email,
      phone,
      packageRequested: data.packageRequested,
      applicantCount:   Number(data.applicantCount) || 1,
      visaSlug:         visa?.slug || '',
      source,
      website:          data.website,
    };

    try {
      await createVisaLeadAsync(payload);
      trackVisaLeadSubmit({
        visaSlug: visa?.slug || '',
        packageRequested: data.packageRequested,
        applicantCount: Number(data.applicantCount) || 1,
        source,
      });
      setSubmittedFirstName(data.firstName);
      setSubmittedNationality(nationality);
      setSuccess(true);
    } catch (err) {
      const message =
        err?.name === 'TimeoutError' || err?.name === 'AbortError'
          ? 'The request timed out. Check your connection and try again.'
          : err?.message || 'Something went wrong. Please try again.';
      setServerError(message);
    }
  }

  if (!isOpen) return null;

  const firstNameReg = register('firstName', {
    required: 'First name is required',
    maxLength: { value: 50, message: 'Max 50 characters' },
  });
  const isApplication = source === 'package_card';
  const title = isApplication
    ? `Apply for ${visa?.countryName} Visa`
    : `Free consultation: ${visa?.countryName} visa`;
  const submitLabel = isApplication ? 'Submit application' : 'Request my call-back';

  return (

    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-[2px] px-0 sm:px-4"
      onClick={handleBackdropClick}
    >

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-form-title"
        className="relative w-full sm:max-w-[500px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 id="lead-form-title" className="font-outfit font-semibold text-[17px] text-gray-900 leading-tight">
              {title}
            </h2>
            <p className="font-outfit font-light text-[13px] text-gray-500 mt-0.5">
              We&rsquo;ll call you within minutes during business hours
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {success ? (
            <SuccessState
              firstName={submittedFirstName}
              onClose={onClose}
            />
          ) : (
            <form id="lead-form" onSubmit={handleSubmit(onFormSubmit)} noValidate>
              <div className="px-6 py-5 flex flex-col gap-5">

                <div
                  style={{
                    position: 'absolute',
                    left: '-9999px',
                    visibility: 'hidden',
                  }}
                  aria-hidden="true"
                >
                  <input
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    {...register('website')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="First name" required htmlFor="lead-first-name" error={errors.firstName?.message}>
                    <input
                      id="lead-first-name"
                      type="text"
                      autoComplete="given-name"
                      placeholder="Sara"
                      className={INPUT_CLS}
                      {...firstNameReg}
                      ref={(el) => { firstNameReg.ref(el); firstFieldRef.current = el; }}
                    />
                  </Field>
                  <Field label="Last name" required htmlFor="lead-last-name" error={errors.lastName?.message}>
                    <input
                      id="lead-last-name"
                      type="text"
                      autoComplete="family-name"
                      placeholder="Ahmed"
                      className={INPUT_CLS}
                      {...register('lastName', {
                        required: 'Last name is required',
                        maxLength: { value: 50, message: 'Max 50 characters' },
                      })}
                    />
                  </Field>
                </div>

                <Field label="Nationality" required htmlFor="lead-nationality" error={errors.nationality?.message}>
                  <NationalitySelect
                    inputId="lead-nationality"
                    value={nationalityValue}
                    onChange={(nat) => setValue('nationality', nat, { shouldDirty: true, shouldValidate: true })}
                    nationalities={nationalities}
                    inputClassName={INPUT_CLS}
                    required
                  />

                  <input
                    type="text"
                    tabIndex={-1}
                    aria-hidden="true"
                    value={nationalityValue?.id ?? ''}
                    readOnly
                    style={{ position: 'absolute', left: '-9999px', visibility: 'hidden' }}
                    {...register('nationality', { required: 'Nationality is required' })}
                  />
                </Field>

                <Field label="Email" htmlFor="lead-email" error={errors.email?.message}>
                  <input
                    id="lead-email"
                    autoComplete="email"
                    type="email"
                    placeholder="Optional, for a written summary of the call"
                    className={INPUT_CLS}
                    {...register('email', {
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Please enter a valid email address',
                      },
                    })}
                  />
                </Field>

                <Field label="Phone number" required htmlFor="lead-phone" error={errors.phone?.message}>
                  <PhoneInput
                    inputId="lead-phone"
                    value={phoneValue}
                    onChange={(val) => setValue('phone', val, { shouldDirty: true, shouldValidate: !!errors.phone })}
                    required
                  />

                  <input
                    type="text"
                    tabIndex={-1}
                    aria-hidden="true"
                    value={phoneValue?.digits ?? ''}
                    readOnly
                    style={{ position: 'absolute', left: '-9999px', visibility: 'hidden' }}
                    {...register('phone', {
                      validate: () => {
                        const { code = '', digits = '' } = getValues('phone') || {};
                        const parsed = parsePhoneNumberFromString(`${code}${digits}`.replace(/\s+/g, ''));
                        return parsed?.isValid() === true || 'Please enter a valid phone number';
                      },
                    })}
                  />
                </Field>

                <fieldset className="flex flex-col gap-1.5">
                  <legend className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Package<span className="text-red-400 ml-0.5">*</span>
                  </legend>
                  <div className="flex flex-col gap-2">
                    {packages.map((pkg) => (
                      <label
                        key={pkg.name}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-primary-50 hover:border-primary-300 transition-colors has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50"
                      >
                        <input
                          type="radio"
                          value={pkg.name}
                          className="accent-primary-600"
                          {...register('packageRequested', { required: 'Please select a package' })}
                        />
                        <div className="flex-1 min-w-0">
                          <span className="font-outfit font-medium text-[14px] text-gray-900">{pkg.name}</span>
                          {pkg.price != null && (
                            <span className="ml-2 font-outfit font-light text-[13px] text-gray-500">
                              {pkg.currency || 'AED'} {Number(pkg.price).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </label>
                    ))}

                    <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-primary-50 hover:border-primary-300 transition-colors has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50">
                      <input
                        type="radio"
                        value="undecided"
                        className="accent-primary-600"
                        {...register('packageRequested')}
                      />
                      <span className="font-outfit font-light text-[14px] text-gray-600">I haven&rsquo;t decided yet</span>
                    </label>
                  </div>
                  {errors.packageRequested && (
                    <p className="text-xs text-red-500 mt-0.5">{errors.packageRequested.message}</p>
                  )}
                </fieldset>

                <Field label="How many people on the application?" htmlFor="lead-applicants" error={errors.applicantCount?.message}>
                  <input
                    id="lead-applicants"
                    inputMode="numeric"
                    type="number"
                    min={1}
                    max={20}
                    className={INPUT_CLS}
                    {...register('applicantCount', {
                      min: { value: 1, message: 'At least 1 applicant' },
                      max: { value: 20, message: 'Maximum 20 applicants' },
                      valueAsNumber: true,
                    })}
                  />
                </Field>

                {serverError && (
                  <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-outfit text-red-700 leading-5">
                    {serverError}
                    {whatsappUrl && (
                      <>
                        {' '}
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold underline underline-offset-2"
                        >
                          WhatsApp us
                        </a>{' '}
                        if it keeps failing.
                      </>
                    )}
                  </div>
                )}

              </div>
            </form>
          )}
        </div>

        {!success && (
          <div className="shrink-0 px-6 py-4 border-t border-gray-100 bg-white rounded-b-3xl">
            <button
              type="submit"
              form="lead-form"
              disabled={isSubmittingLead}
              className="w-full flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-outfit font-semibold text-[15px] py-3 px-6 rounded-full transition-colors duration-200"
            >
              {isSubmittingLead ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Sending…
                </>
              ) : (
                submitLabel
              )}
            </button>
            <p className="text-center text-[11px] font-outfit font-light text-gray-400 mt-2">
              We&rsquo;ll never share your details with third parties.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
