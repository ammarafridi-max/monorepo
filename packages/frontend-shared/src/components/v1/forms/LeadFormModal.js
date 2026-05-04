'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Loader2, CheckCircle2 } from 'lucide-react';
import { useCreateVisaLead } from '../../../hooks/visa-leads/useCreateVisaLead.js';
import { useGetNationalities } from '../../../hooks/insurance/useGetNationalities.js';
import NationalitySelect from '../form-elements/NationalitySelect.js';
import PhoneInput from '../form-elements/PhoneInput.js';

const INPUT_CLS =
  'border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full placeholder:text-gray-300';

function Field({ label, error, required, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
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

export default function LeadFormModal({ isOpen, onClose, visa, defaultPackage = 'undecided', source = 'hero_cta' }) {
  const [success, setSuccess] = useState(false);
  const [submittedFirstName, setSubmittedFirstName] = useState('');
  const [submittedNationality, setSubmittedNationality] = useState('');
  const [serverError, setServerError] = useState(null);

  const { createVisaLeadAsync, isSubmittingLead } = useCreateVisaLead();
  const { nationalities = [], isLoadingNationalities } = useGetNationalities();

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
    } else {
      document.body.style.overflow = '';
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
      applicantCount:   Number(data.applicantCount),
      visaSlug:         visa?.slug || '',
      source,
      website:          data.website,
    };

    try {
      await createVisaLeadAsync(payload);
      setSubmittedFirstName(data.firstName);
      setSubmittedNationality(nationality);
      setSuccess(true);
    } catch (err) {
      setServerError(err?.message || 'Something went wrong. Please try again or WhatsApp us.');
    }
  }

  if (!isOpen) return null;

  return (

    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-[2px] px-0 sm:px-4"
      onClick={handleBackdropClick}
    >

      <div
        className="relative w-full sm:max-w-[500px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="font-outfit font-semibold text-[17px] text-gray-900 leading-tight">
              Apply for {visa?.countryName} Visa
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
                  <Field label="First name" required error={errors.firstName?.message}>
                    <input
                      type="text"
                      placeholder="Sara"
                      className={INPUT_CLS}
                      {...register('firstName', {
                        required: 'First name is required',
                        maxLength: { value: 50, message: 'Max 50 characters' },
                      })}
                    />
                  </Field>
                  <Field label="Last name" required error={errors.lastName?.message}>
                    <input
                      type="text"
                      placeholder="Ahmed"
                      className={INPUT_CLS}
                      {...register('lastName', {
                        required: 'Last name is required',
                        maxLength: { value: 50, message: 'Max 50 characters' },
                      })}
                    />
                  </Field>
                </div>

                <Field label="Nationality" required error={errors.nationality?.message}>
                  <NationalitySelect
                    value={nationalityValue}
                    onChange={(nat) => setValue('nationality', nat, { shouldDirty: true, shouldValidate: true })}
                    nationalities={isLoadingNationalities ? [] : nationalities}
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

                <Field label="Email" required error={errors.email?.message}>
                  <input
                    type="email"
                    placeholder="sara@example.com"
                    className={INPUT_CLS}
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Please enter a valid email address',
                      },
                    })}
                  />
                </Field>

                <Field label="Phone number" required error={errors.phone?.message}>
                  <PhoneInput
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
                        const digits = getValues('phone')?.digits ?? '';
                        return digits.trim().length >= 5 || 'Please enter a valid phone number';
                      },
                    })}
                  />
                </Field>

                <Field label="Package" required>
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
                </Field>

                <Field label="How many people on the application?" required error={errors.applicantCount?.message}>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    className={INPUT_CLS}
                    {...register('applicantCount', {
                      required: 'Required',
                      min: { value: 1, message: 'At least 1 applicant' },
                      max: { value: 20, message: 'Maximum 20 applicants' },
                      valueAsNumber: true,
                    })}
                  />
                </Field>

                {serverError && (
                  <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-outfit text-red-700 leading-5">
                    {serverError}
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
              className="w-full flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-outfit font-medium text-[15px] py-3 px-6 rounded-xl transition-colors duration-200"
            >
              {isSubmittingLead ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Sending…
                </>
              ) : (
                'Submit application'
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
