"use client";

import { useContext, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Pencil,
  Check,
  User,
  Mail,
  ArrowLeft,
  AlertCircle,
  Lock,
  Loader2,
  X,
  ListChecks,
} from "lucide-react";
import { InsuranceContext } from "../../contexts/InsuranceContext.js";
import { useCurrency } from "../../contexts/CurrencyContext.js";
import { useFinalizeInsurance } from "../../hooks/insurance/useFinalizeInsurance.js";
import { calcDays } from "../../utils/insuranceHelpers.js";
import { pixelInitiateCheckout } from "../../utils/pixel";
import { getBaseBenefits, parsePlanName } from "../../utils/insurancePlans";

function BenefitsModal({ quote, onClose }) {
  const benefits = getBaseBenefits(quote.benefits);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <p className="font-bold text-gray-900 text-sm">
              {parsePlanName(quote.name)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Coverage details</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-4 flex flex-col gap-1">
          {benefits.map((b) => (
            <div
              key={b.cover}
              className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-50 last:border-0"
            >
              <span className="text-sm text-gray-600">{b.cover}</span>
              <span
                className={`text-sm font-semibold shrink-0 ${b.amount === "Not Covered" ? "text-gray-300" : "text-gray-900"}`}
              >
                {b.amount || "—"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatDate(str) {
  if (!str) return "—";
  const d = new Date(str);
  if (isNaN(d)) return str;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDOB(str) {
  if (!str) return "—";
  const d = new Date(str);
  if (isNaN(d)) return str;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function SectionCard({ title, editHref, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-900">{title}</h2>
        <Link
          href={editHref}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 hover:text-primary-900 transition-colors"
        >
          <Pencil size={11} strokeWidth={2.5} />
          Edit
        </Link>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 font-medium shrink-0">
        {label}
      </span>
      <span className="text-sm text-gray-900 font-medium text-right">
        {value || "—"}
      </span>
    </div>
  );
}

function PassengerBlock({
  passenger,
  index,
  typeLabel,
  isFirstAdult,
  email,
  mobile,
  streetAddress,
  city,
  country,
}) {
  const fullName = [passenger.title, passenger.firstName, passenger.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`${index > 0 ? "pt-5 mt-5 border-t border-gray-100" : ""}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
          <User size={12} className="text-primary-700" />
        </div>
        <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">
          {typeLabel} {index + 1}
          {isFirstAdult && (
            <span className="ml-2 text-primary-600 normal-case font-semibold">
              · Primary Traveller
            </span>
          )}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
        <Row label="Full Name" value={fullName || "—"} />
        <Row
          label="Nationality"
          value={passenger.nationality?.nationality ?? passenger.nationality}
        />
        <Row label="Date of Birth" value={formatDOB(passenger.dob)} />
        <Row label="Passport No." value={passenger.passport} />
      </div>

      {isFirstAdult && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
            Contact & Address
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
            <Row label="Email" value={email} />
            <Row label="Phone" value={mobile?.digits} />
            <Row label="Address" value={streetAddress} />
            <Row label="City" value={city} />
            <Row label="Country" value={country} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReviewSummary() {
  const {
    sessionId,
    quoteId,
    schemeId,
    selectedQuote,
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
  } = useContext(InsuranceContext);
  const { formatMoney } = useCurrency();

  const [agreed, setAgreed] = useState(false);
  const [showBenefits, setShowBenefits] = useState(false);
  const { finalizeInsurance, isFinalizing } = useFinalizeInsurance();

  const days = calcDays(journeyType, startDate, endDate);
  const displayPremium = selectedQuote
    ? formatMoney(selectedQuote.premium, selectedQuote.currency)
    : null;

  const grouped = [
    {
      key: "adults",
      label: "Adult",
      list: passengers.filter((p) => p.type === "adults"),
    },
    {
      key: "children",
      label: "Child",
      list: passengers.filter((p) => p.type === "children"),
    },
    {
      key: "seniors",
      label: "Senior",
      list: passengers.filter((p) => p.type === "seniors"),
    },
  ].filter((g) => g.list.length > 0);

  const firstAdultId = passengers.find((p) => p.type === "adults")?.id;

  const totalTravellers =
    quantity.adults + quantity.children + quantity.seniors;
  const travellersLabel = [
    quantity.adults > 0 &&
      `${quantity.adults} Adult${quantity.adults > 1 ? "s" : ""}`,
    quantity.children > 0 &&
      `${quantity.children} Child${quantity.children > 1 ? "ren" : ""}`,
    quantity.seniors > 0 &&
      `${quantity.seniors} Senior${quantity.seniors > 1 ? "s" : ""}`,
  ]
    .filter(Boolean)
    .join(", ");

  const TRIP_TYPE_LABEL = {
    single: "Single Trip",
    annual: "Annual Multi-Trip",
    biennial: "Biennial Multi-Trip",
  };

  function handleConfirm() {
    if (!agreed || isFinalizing) return;
    pixelInitiateCheckout({
      currency: selectedQuote.currency ?? "AED",
      value: Number(selectedQuote.premium) || 0,
    });
    finalizeInsurance(
      {
        sessionId,
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
        currency: "AED",
      },
      {
        onSuccess: (data) => {
          window.location.assign(data.paymentUrl);
        },
      },
    );
  }

  if (!selectedQuote || passengers.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-24 text-center">
        <AlertCircle size={40} className="text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-6">
          Your session looks incomplete. Please start from the beginning.
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
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900">
          Review Your Policy
        </h1>
        <p className="text-sm text-gray-500 mt-1.5">
          Please check all details carefully. You can edit any section before
          confirming.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="flex flex-col gap-5">
          <SectionCard title="Selected Plan" editHref="/insurance-booking/quote">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                <ShieldCheck size={20} className="text-primary-700" />
              </div>
              <div>
                <p className="font-bold text-gray-900">
                  {parsePlanName(selectedQuote.name)}
                </p>
                <p className="text-2xl font-extrabold text-gray-900 mt-0.5">
                  {displayPremium.code} {displayPremium.value}
                </p>
                <p className="text-xs text-gray-400">Total Premium</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowBenefits(true)}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 hover:text-primary-900 border border-primary-200 hover:border-primary-400 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              <ListChecks size={13} />
              View Coverage Details
            </button>
          </SectionCard>

          {showBenefits && (
            <BenefitsModal
              quote={selectedQuote}
              onClose={() => setShowBenefits(false)}
            />
          )}

          <SectionCard title="Trip Details" editHref="/">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <Row
                label="Journey Type"
                value={TRIP_TYPE_LABEL[journeyType] || journeyType}
              />
              <Row label="Region" value={region?.name} />
              {journeyType === "annual" ? (
                <Row label="Start Date" value={formatDate(startDate)} />
              ) : (
                <>
                  <Row label="Departure" value={formatDate(startDate)} />
                  <Row label="Return" value={formatDate(endDate)} />
                </>
              )}
              <Row
                label="Duration"
                value={
                  journeyType === "annual"
                    ? "Annual (365 days)"
                    : journeyType === "biennial"
                      ? "Biennial (730 days)"
                      : `${days} days`
                }
              />
              <Row label="Travellers" value={travellersLabel || "—"} />
            </div>
          </SectionCard>

          {grouped.map(({ key, label, list }) => (
            <SectionCard
              key={key}
              title={`${label}${list.length > 1 ? "s" : ""}`}
              editHref="/insurance-booking/passengers"
            >
              {list.map((passenger, index) => (
                <PassengerBlock
                  key={passenger.id}
                  passenger={passenger}
                  index={index}
                  typeLabel={label}
                  isFirstAdult={passenger.id === firstAdultId}
                  email={email}
                  mobile={mobile}
                  streetAddress={streetAddress}
                  city={city}
                  country={country}
                />
              ))}
            </SectionCard>
          ))}
        </div>

        <div className="lg:sticky lg:top-6 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Price Summary
              </p>
            </div>
            <div className="px-5 py-4 flex flex-col gap-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Plan</span>
                <span className="font-semibold text-gray-900">
                  {parsePlanName(selectedQuote.name)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Duration</span>
                <span className="font-semibold text-gray-900">
                  {journeyType === "annual"
                    ? "365 days"
                    : journeyType === "biennial"
                      ? "730 days"
                      : `${days} days`}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Travellers</span>
                <span className="font-semibold text-gray-900">
                  {totalTravellers}
                </span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between items-baseline">
                <span className="text-sm font-bold text-gray-900">Total</span>
                <span className="text-2xl font-extrabold text-gray-900">
                  {displayPremium.code} {displayPremium.value}
                </span>
              </div>
            </div>
            {email && (
              <div className="px-5 py-3 bg-primary-50 border-t border-primary-100">
                <p className="text-xs text-primary-700">
                  <Mail size={11} className="inline mr-1" />
                  Policy sent to <span className="font-semibold">{email}</span>
                </p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <div
                onClick={() => setAgreed((p) => !p)}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${agreed ? "bg-primary-700 border-primary-700" : "border-gray-300 hover:border-primary-400"}`}
              >
                {agreed && (
                  <Check size={11} strokeWidth={3} className="text-white" />
                )}
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                I confirm all details above are correct and I agree to the{" "}
                <Link
                  href="/terms"
                  className="text-primary-700 hover:underline font-semibold"
                >
                  Terms & Conditions
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="text-primary-700 hover:underline font-semibold"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </label>

            <button
              onClick={handleConfirm}
              disabled={!agreed || isFinalizing}
              className="w-full inline-flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold py-3.5 rounded-xl transition-colors"
            >
              {isFinalizing ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <Lock size={14} />
                  Confirm & Pay {displayPremium.code} {displayPremium.value}
                </>
              )}
            </button>

            <p className="text-center text-xs text-gray-400">
              Secured by 256-bit SSL encryption
            </p>
          </div>

          <div className="text-center">
            <Link
              href="/insurance-booking/passengers"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft size={13} /> Back to passengers
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
