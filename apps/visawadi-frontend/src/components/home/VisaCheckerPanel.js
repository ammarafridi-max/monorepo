"use client";

import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Search } from "lucide-react";
import { COUNTRIES } from "@travel-suite/frontend-shared/data/countries";
import { useVisaCheck } from "@travel-suite/frontend-shared/hooks/visa/useVisaCheck";
import { useVisaDestinations } from "@travel-suite/frontend-shared/hooks/visa/useVisaDestinations";
import FieldSelect from "@/components/design-system/FieldSelect";

export default function VisaCheckerPanel({ resultPath = "/visa-check" }) {
  const router = useRouter();
  const v = useVisaCheck();
  const {
    destinations,
    loading: destinationsLoading,
    error: destinationsError,
  } = useVisaDestinations();

  const busy = v.loading || destinationsLoading;
  const error = v.error || destinationsError;

  async function onSubmit(e) {
    const answer = await v.submit(e);
    if (!resultPath || !answer?.destination) return;
    const params = new URLSearchParams({ nationality: v.nationality });
    if (v.residence) params.set("residence", v.residence);
    router.push(
      `${resultPath}/${String(answer.destination).toLowerCase()}?${params.toString()}`,
    );
  }

  return (
    <form onSubmit={onSubmit} aria-label="Check whether you need a visa">
      <div className="grid gap-4 md:grid-cols-3 md:gap-4">
        <FieldSelect
          label="Nationality"
          value={v.nationality}
          onChange={v.setNationality}
          options={COUNTRIES}
          placeholder="Your passport"
        />
        <FieldSelect
          label="You live in"
          hint="optional"
          value={v.residence}
          onChange={v.setResidence}
          options={COUNTRIES}
          placeholder="Country of residence"
        />
        <FieldSelect
          label="Going to"
          value={v.destination}
          onChange={v.setDestination}
          options={destinations}
          placeholder={destinationsLoading ? "Loading" : "Destination"}
          disabled={destinationsLoading}
        />
      </div>

      <button
        type="submit"
        disabled={busy}
        className="mt-5 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-8 text-[1.0625rem] font-semibold text-white shadow-float transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? (
          <Loader2 size={18} aria-hidden="true" className="animate-spin" />
        ) : (
          <Search size={18} aria-hidden="true" />
        )}
        {v.loading ? "Checking" : "Check my visa"}
      </button>

      <p role="status" aria-live="polite" className="sr-only">
        {v.loading ? "Checking visa requirement" : ""}
      </p>

      {error && (
        <p
          role="alert"
          className="mt-4 flex items-start gap-2.5 rounded-field border border-notice/30 bg-notice-soft px-4 py-3.5 text-meta font-medium text-ink"
        >
          <AlertCircle
            size={17}
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-notice"
          />
          {error}
        </p>
      )}
    </form>
  );
}
