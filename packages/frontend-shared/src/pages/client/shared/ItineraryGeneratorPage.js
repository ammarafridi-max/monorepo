"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import {
  Loader2,
  Sparkles,
  Plane,
  Plus,
  Trash2,
  UploadCloud,
  ArrowRight,
} from "lucide-react";
import SearchableSelect from "../../../components/form-elements/v1/SearchableSelect";
import CitySearch from "../../../components/form-elements/v2/CitySearch";
import Email from "../../../components/form-elements/v1/Email";
import PhoneInput from "../../../components/form-elements/v1/PhoneInput";
import DatePicker from "../../../components/form-elements/v1/DatePicker";
import { useGenerateItinerary } from "../../../hooks/itineraries/useGenerateItinerary";
import { useParseDocuments } from "../../../hooks/itineraries/useParseDocuments";
import { trackItineraryGenerate } from "../../../utils/analytics";

// Contact details are shared with the dummy-ticket flow via localStorage
// (keys: 'email' as a string, 'phoneNumber' as { code, digits } JSON).
function safeParse(key, fallback) {
  try {
    if (typeof window === "undefined") return fallback;
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function safeGetItem(key, fallback = "") {
  if (typeof window === "undefined") return fallback;
  return localStorage.getItem(key) || fallback;
}

const PURPOSE_OPTIONS = [
  { value: "tourism", label: "Tourism" },
  { value: "business", label: "Business" },
  { value: "family-visit", label: "Family Visit" },
  { value: "conference", label: "Conference" },
  { value: "medical", label: "Medical" },
  { value: "study", label: "Study" },
];

const RESERVATION_OPTIONS = [
  { value: "none", label: "Not arranged yet" },
  { value: "unconfirmed", label: "I have one — not confirmed" },
  { value: "confirmed", label: "I have one — confirmed" },
];

const inputClass =
  "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition";
const labelClass = "text-xs font-medium text-gray-500";
const errorClass = "text-xs text-accent-600 mt-1";

function Field({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className={labelClass}>{label}</label>}
      {children}
      {error && <span className={errorClass}>{error.message}</span>}
    </div>
  );
}

function SectionCard({ step, title, subtitle, children }) {
  return (
    <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 sm:p-8">
      <div className="flex items-start gap-3 mb-6">
        <span className="shrink-0 w-7 h-7 rounded-full bg-primary-700 text-white text-xs font-bold flex items-center justify-center">
          {step}
        </span>
        <div>
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

// Reusable controlled country dropdown (stores the country name as a string).
function CountrySelect({ control, name, rules, countryItems, placeholder }) {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field }) => (
        <SearchableSelect
          items={countryItems}
          value={field.value ? { id: field.value, name: field.value } : null}
          onChange={(item) => field.onChange(item?.name ?? "")}
          placeholder={placeholder || "Select country…"}
        />
      )}
    />
  );
}

export default function ItineraryGeneratorPage({
  countries = [],
  onAnalytics,
}) {
  const { generateItinerary, isGeneratingItinerary } = useGenerateItinerary({
    onAnalytics,
  });
  const [docs, setDocs] = useState([]); // optional supporting docs (auto-fill: coming soon)

  const {
    register,
    handleSubmit,
    control,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      traveller: { firstName: "", email: "", phone: { code: "", digits: "" } },
      travellers: 1,
      purpose: "",
      visaCountry: "",
      fromCountry: "",
      reservations: { flight: "none", hotel: "none" },
      segments: [
        {
          from: { city: "", country: "" },
          to: { city: "", country: "" },
          date: "",
        },
      ],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "segments",
  });
  const { parseDocuments, isParsing } = useParseDocuments();
  const watchedSegments = watch("segments"); // live values, for chronological date limits
  const countryItems = countries.map((c) => ({ id: c, name: c }));

  // The first segment can't start before tomorrow; later segments are bounded
  // by the previous segment's date (which is itself already >= tomorrow).
  const tomorrow = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();

  // Prefill contact details from localStorage if present (shared with the
  // dummy-ticket flow); otherwise the fields stay empty for fresh entry. Run
  // after mount to avoid a hydration mismatch.
  useEffect(() => {
    const storedEmail = safeGetItem("email", "");
    const storedPhone = safeParse("phoneNumber", null);
    if (storedEmail) setValue("traveller.email", storedEmail);
    if (storedPhone && (storedPhone.code || storedPhone.digits)) {
      setValue("traveller.phone", {
        code: storedPhone.code || "",
        digits: storedPhone.digits || "",
      });
    }
  }, [setValue]);

  // Upload supporting documents -> AI extracts segments + reservations -> prefill.
  function handleDocs(e) {
    const files = Array.from(e.target.files || []);
    setDocs(files);
    if (!files.length) return;
    parseDocuments(files, {
      onSuccess: (data) => {
        const segs = (data?.segments || []).filter(
          (s) => s.from?.city || s.to?.city || s.date,
        );
        if (segs.length) {
          replace(
            segs.map((s) => ({
              from: {
                city: s.from?.city || "",
                country: s.from?.country || "",
              },
              to: { city: s.to?.city || "", country: s.to?.country || "" },
              date: s.date || "",
            })),
          );
          if (data.reservations?.flight)
            setValue("reservations.flight", data.reservations.flight);
          if (data.reservations?.hotel)
            setValue("reservations.hotel", data.reservations.hotel);
          toast.success(
            `Filled ${segs.length} segment${segs.length > 1 ? "s" : ""} from your documents — please review below.`,
          );
        } else {
          toast("We couldn’t read any segments — please add them manually.");
        }
      },
    });
  }

  function addSegment() {
    const segs = getValues("segments");
    const prev = segs[segs.length - 1];
    append({
      from:
        prev?.to?.city || prev?.to?.country
          ? { ...prev.to }
          : { city: "", country: "" },
      to: { city: "", country: "" },
      date: "",
    });
  }

  function onSubmit(values) {
    // Persist contact details for next time / the dummy-ticket flow.
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("email", values.traveller.email.trim());
        localStorage.setItem("phoneNumber", JSON.stringify(values.traveller.phone));
      } catch {
        /* ignore storage errors */
      }
    }
    trackItineraryGenerate({
      purpose: values.purpose,
      visaCountry: values.visaCountry,
      fromCountry: values.fromCountry,
      travellers: Number(values.travellers) || 1,
      segmentCount: values.segments.length,
    });
    generateItinerary({
      traveller: {
        firstName: values.traveller.firstName.trim(),
        email: values.traveller.email.trim(),
        phone: values.traveller.phone,
      },
      travellers: Number(values.travellers) || 1,
      purpose: values.purpose,
      visaCountry: values.visaCountry,
      fromCountry: values.fromCountry,
      reservations: values.reservations,
      segments: values.segments.map((s) => ({
        from: { city: s.from.city.trim(), country: s.from.country },
        to: { city: s.to.city.trim(), country: s.to.country },
        date: s.date,
      })),
    });
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 bg-primary-50 rounded-full px-3 py-1 mb-3">
          <Sparkles size={13} /> Embassy-ready in minutes
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Create Your Travel Itinerary
        </h1>
        <p className="text-sm text-gray-500 mt-2 max-w-xl mx-auto">
          Tell us about your trip and we&apos;ll prepare a professional,
          day-by-day itinerary for your visa application.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {/* ---------- Part 1: details & trip ---------- */}
        <SectionCard
          step={1}
          title="Your details"
          subtitle="Who the itinerary is for and where you're applying."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="First name" error={errors.traveller?.firstName}>
              <input
                className={inputClass}
                placeholder="Jane"
                {...register("traveller.firstName", {
                  required: "Please enter your first name",
                })}
              />
            </Field>
            <Field label="Email address" error={errors.traveller?.email}>
              <Controller
                control={control}
                name="traveller.email"
                rules={{
                  required: "Please enter your email",
                  pattern: {
                    value: /^\S+@\S+\.\S+$/,
                    message: "Enter a valid email",
                  },
                }}
                render={({ field }) => (
                  <Email email={field.value} onChange={field.onChange} />
                )}
              />
            </Field>
            <Field label="Phone number" error={errors.traveller?.phone}>
              <Controller
                control={control}
                name="traveller.phone"
                rules={{
                  validate: (v) =>
                    v?.digits?.trim() ? true : "Please enter your phone number",
                }}
                render={({ field }) => (
                  <PhoneInput
                    value={field.value}
                    onChange={field.onChange}
                    required
                  />
                )}
              />
            </Field>
            <Field label="Number of travellers" error={errors.travellers}>
              <input
                type="number"
                min={1}
                max={20}
                className={inputClass}
                {...register("travellers", {
                  min: { value: 1, message: "At least 1 traveller" },
                  valueAsNumber: true,
                })}
              />
            </Field>
            <Field label="Purpose of trip" error={errors.purpose}>
              <select
                className={`${inputClass} bg-white`}
                defaultValue=""
                {...register("purpose", { required: "Select a purpose" })}
              >
                <option value="" disabled>
                  Select a purpose…
                </option>
                {PURPOSE_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Applying from (your country)"
              error={errors.fromCountry}
            >
              <CountrySelect
                control={control}
                name="fromCountry"
                rules={{ required: "Select your country" }}
                countryItems={countryItems}
              />
            </Field>
            <Field
              label="Applying to (embassy country)"
              error={errors.visaCountry}
            >
              <CountrySelect
                control={control}
                name="visaCountry"
                rules={{ required: "Select the country you are applying to" }}
                countryItems={countryItems}
              />
            </Field>
          </div>
        </SectionCard>

        {/* ---------- Part 2: supporting info ---------- */}
        <SectionCard
          step={2}
          title="Supporting information"
          subtitle="Optional — but it helps us craft a more accurate itinerary."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Flight reservation">
              <select
                className={`${inputClass} bg-white`}
                {...register("reservations.flight")}
              >
                {RESERVATION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Hotel reservation">
              <select
                className={`${inputClass} bg-white`}
                {...register("reservations.hotel")}
              >
                {RESERVATION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="mt-5">
            <label className={labelClass}>
              Supporting documents (optional)
            </label>
            <label
              className={`mt-1.5 flex flex-col items-center justify-center gap-1.5 border-2 border-dashed rounded-xl px-4 py-6 transition-colors ${
                isParsing
                  ? "border-primary-300 bg-primary-50/40 cursor-wait"
                  : "border-gray-200 cursor-pointer hover:border-primary-300 hover:bg-primary-50/40"
              }`}
            >
              {isParsing ? (
                <Loader2 size={22} className="text-primary-500 animate-spin" />
              ) : (
                <UploadCloud size={22} className="text-gray-300" />
              )}
              <span className="text-sm text-gray-500">
                {isParsing
                  ? "Reading your documents…"
                  : docs.length
                    ? `${docs.length} file${docs.length > 1 ? "s" : ""} selected`
                    : "Upload flight or hotel reservations"}
              </span>
              <span className="text-[11px] text-gray-400">
                PDF or image · we&apos;ll read these to auto-fill your trip
                below
              </span>
              <input
                type="file"
                multiple
                accept="application/pdf,image/*"
                className="hidden"
                disabled={isParsing}
                onChange={handleDocs}
              />
            </label>
            {docs.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-2">
                {docs.map((f, i) => (
                  <li
                    key={i}
                    className="text-xs text-gray-500 bg-gray-100 rounded-lg px-2.5 py-1"
                  >
                    {f.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </SectionCard>

        {/* ---------- Part 3: segments ---------- */}
        <SectionCard
          step={3}
          title="Your itinerary"
          subtitle="Add each leg of your trip with its date — e.g. Dubai → Zurich, Zurich → Paris, Paris → Dubai."
        >
          <div className="flex flex-col gap-8">
            {fields.map((field, i) => (
              <div key={field.id} className="rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700">
                    <Plane size={13} /> Segment {i + 1}
                  </span>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      className="text-gray-400 hover:text-accent-600 transition-colors"
                      aria-label="Remove segment"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="From" error={errors.segments?.[i]?.from?.city}>
                    <Controller
                      control={control}
                      name={`segments.${i}.from.city`}
                      rules={{ required: "Select a departure city" }}
                      render={({ field }) => (
                        <CitySearch
                          city={field.value}
                          country={watchedSegments?.[i]?.from?.country}
                          placeholder="Search departure city…"
                          onChange={(sel) => {
                            field.onChange(sel.city);
                            setValue(
                              `segments.${i}.from.country`,
                              sel.country,
                              { shouldValidate: true },
                            );
                          }}
                        />
                      )}
                    />
                  </Field>
                  <Field label="To" error={errors.segments?.[i]?.to?.city}>
                    <Controller
                      control={control}
                      name={`segments.${i}.to.city`}
                      rules={{ required: "Select a destination city" }}
                      render={({ field }) => (
                        <CitySearch
                          city={field.value}
                          country={watchedSegments?.[i]?.to?.country}
                          placeholder="Search destination city…"
                          onChange={(sel) => {
                            field.onChange(sel.city);
                            setValue(`segments.${i}.to.country`, sel.country, {
                              shouldValidate: true,
                            });
                          }}
                        />
                      )}
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field
                      label="Travel date"
                      error={errors.segments?.[i]?.date}
                    >
                      <Controller
                        control={control}
                        name={`segments.${i}.date`}
                        rules={{
                          required: "Select a date",
                          validate: (v) => {
                            if (i === 0) return true;
                            const prev = getValues(`segments.${i - 1}.date`);
                            return (
                              !prev ||
                              !v ||
                              v >= prev ||
                              "Must be on or after the previous segment"
                            );
                          },
                        }}
                        render={({ field: f }) => (
                          <DatePicker
                            value={f.value}
                            onChange={f.onChange}
                            placeholder="Select travel date"
                            minDate={
                              i > 0
                                ? watchedSegments?.[i - 1]?.date || tomorrow
                                : tomorrow
                            }
                          />
                        )}
                      />
                    </Field>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addSegment}
              className="self-start inline-flex items-center gap-2 text-sm font-semibold text-primary-700 border border-primary-200 hover:bg-primary-50 px-4 py-2.5 rounded-xl transition-colors"
            >
              <Plus size={15} /> Add segment
            </button>
          </div>
        </SectionCard>

        <button
          type="submit"
          disabled={isGeneratingItinerary}
          className="flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:opacity-70 text-white font-semibold text-sm px-6 py-3.5 rounded-xl transition-colors"
        >
          {isGeneratingItinerary ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Generating…
            </>
          ) : (
            <>
              Generate my itinerary <ArrowRight size={15} />
            </>
          )}
        </button>
      </form>

      {isGeneratingItinerary && (
        <div className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <Loader2 size={40} className="animate-spin text-primary-600" />
          <p className="text-sm font-medium text-gray-700">
            Building your day-by-day itinerary…
          </p>
          <p className="text-xs text-gray-400">
            This usually takes 15–30 seconds.
          </p>
        </div>
      )}
    </div>
  );
}
