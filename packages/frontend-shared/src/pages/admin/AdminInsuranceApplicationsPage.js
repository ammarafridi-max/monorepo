"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowUpRight,
  Trash2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useGetInsuranceApplications } from "../../hooks/insurance/useGetInsuranceApplications";
import { useDeleteInsuranceApplication } from "../../hooks/insurance/useDeleteInsuranceApplication";
import { useCreateNationalities } from "../../hooks/insurance/useCreateNationalities";
import { useGetInsuranceApplicationsSummary } from "../../hooks/insurance/useGetInsuranceApplicationsSummary";

const PAYMENT_TABS = [
  { value: "", label: "All" },
  { value: "PAID", label: "Paid" },
  { value: "UNPAID", label: "Unpaid" },
  { value: "PENDING", label: "Pending" },
  { value: "FAILED", label: "Failed" },
  { value: "REFUNDED", label: "Refunded" },
];

const JOURNEY_TABS = [
  { value: "", label: "All" },
  { value: "single", label: "Single" },
  { value: "annual", label: "Annual" },
  { value: "biennial", label: "Biennial" },
];

const PAYMENT_CFG = {
  PAID: {
    dot: "bg-green-500",
    cls: "bg-green-50   text-green-700   border-green-200",
  },
  UNPAID: {
    dot: "bg-amber-400",
    cls: "bg-amber-50   text-amber-700   border-amber-200",
  },
  PENDING: {
    dot: "bg-blue-400",
    cls: "bg-blue-50    text-blue-700    border-blue-200",
  },
  FAILED: {
    dot: "bg-red-500",
    cls: "bg-red-50     text-red-700     border-red-200",
  },
  REFUNDED: {
    dot: "bg-gray-400",
    cls: "bg-gray-100   text-gray-600    border-gray-200",
  },
};

const JOURNEY_CFG = {
  single: "bg-blue-50   text-blue-700   border-blue-200",
  annual: "bg-purple-50 text-purple-700 border-purple-200",
  biennial: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

function PaymentBadge({ status }) {
  const cfg = PAYMENT_CFG[status] ?? {
    dot: "bg-gray-400",
    cls: "bg-gray-100 text-gray-500 border-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {{
        PAID: "Paid",
        UNPAID: "Unpaid",
        PENDING: "Pending",
        FAILED: "Failed",
        REFUNDED: "Refunded",
      }[status] ?? status}
    </span>
  );
}

function JourneyBadge({ type }) {
  const cls = JOURNEY_CFG[type] ?? "bg-gray-100 text-gray-500 border-gray-200";
  return (
    <span
      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cls}`}
    >
      {type ? type.charAt(0).toUpperCase() + type.slice(1) : "—"}
    </span>
  );
}

function fmtDate(str) {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtAmount(amountPaid) {
  if (!amountPaid?.amount) return "—";
  return `${amountPaid.currency ?? ""} ${Number(amountPaid.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`.trim();
}

function leadName(app) {
  if (app.leadPassenger) return app.leadPassenger;
  const p = app.passengers?.[0];
  if (!p) return "—";
  const name = [p.firstName, p.lastName].filter(Boolean).join(" - ");
  return [p.title, name].filter(Boolean).join(" ") || "—";
}

function ApplicationsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const {
    applications = [],
    pagination,
    isLoadingApplications,
  } = useGetInsuranceApplications();
  const { summary, isLoadingSummary } = useGetInsuranceApplicationsSummary();
  const { deleteInsuranceApplication, isDeleting } =
    useDeleteInsuranceApplication();
  const { createNationalities, isCreatingNationalities } =
    useCreateNationalities();

  const page = Number(searchParams.get("page") || 1);
  const totalPages = pagination?.totalPages ?? 1;
  const total = pagination?.total ?? 0;

  // URL-derived filter values (source of truth for the data hooks).
  const urlSearch = searchParams.get("search") ?? "";
  const urlPayment = searchParams.get("paymentStatus") || "";
  const urlJourney = searchParams.get("journeyType") || "";
  const urlCreatedAt = searchParams.get("createdAt") ?? "all_time";

  // Local UI state mirrors the URL but updates eagerly on user input so the
  // controls never snap back to a stale value while router.push is in flight.
  const [localSearch, setLocalSearch] = useState(urlSearch);
  const [localPayment, setLocalPayment] = useState(urlPayment);
  const [localJourney, setLocalJourney] = useState(urlJourney);
  const [localCreatedAt, setLocalCreatedAt] = useState(urlCreatedAt);

  // Phones hide the inline filter bar behind a modal (see below).
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Reconcile local state when the URL changes externally (back/forward).
  useEffect(() => setLocalSearch(urlSearch), [urlSearch]);
  useEffect(() => setLocalPayment(urlPayment), [urlPayment]);
  useEffect(() => setLocalJourney(urlJourney), [urlJourney]);
  useEffect(() => setLocalCreatedAt(urlCreatedAt), [urlCreatedAt]);

  function pushParams(p) {
    p.delete("page");
    router.push(`${pathname}?${p.toString()}`);
  }

  function setParam(key, value) {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value);
    else p.delete(key);
    pushParams(p);
  }

  // Debounced sync: local search → URL, so we don't push on every keystroke.
  useEffect(() => {
    if (localSearch === urlSearch) return;
    const t = setTimeout(() => {
      const p = new URLSearchParams(searchParams.toString());
      if (localSearch) p.set("search", localSearch);
      else p.delete("search");
      pushParams(p);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch, urlSearch]);

  function goToPage(p) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  }

  // Count of filters narrowed away from their defaults — drives the badge on
  // the filter button so active filters are visible without opening the modal.
  const activeFilterCount = [
    localPayment !== "",
    localJourney !== "",
    localCreatedAt !== "all_time",
  ].filter(Boolean).length;

  // Filter controls, extracted so the same inputs render in the modal on every
  // screen size. Width comes from the caller via `className`.
  const selectCls =
    "px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white";

  const paymentControl = (className = "") => (
    <select
      value={localPayment}
      onChange={(e) => {
        setLocalPayment(e.target.value);
        setParam("paymentStatus", e.target.value);
      }}
      className={`${selectCls} ${className}`}
    >
      <option value="">All statuses</option>
      {PAYMENT_TABS.filter(({ value }) => value !== "").map(
        ({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ),
      )}
    </select>
  );

  const journeyControl = (className = "") => (
    <select
      value={localJourney}
      onChange={(e) => {
        setLocalJourney(e.target.value);
        setParam("journeyType", e.target.value);
      }}
      className={`${selectCls} ${className}`}
    >
      <option value="">All journeys</option>
      {JOURNEY_TABS.filter(({ value }) => value !== "").map(
        ({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ),
      )}
    </select>
  );

  const timeControl = (className = "") => (
    <select
      value={localCreatedAt}
      onChange={(e) => {
        setLocalCreatedAt(e.target.value);
        setParam("createdAt", e.target.value);
      }}
      className={`${selectCls} ${className}`}
    >
      <option value="all_time">All time</option>
      <option value="24_hours">Last 24 hours</option>
      <option value="7_days">Last 7 days</option>
      <option value="30_days">Last 30 days</option>
      <option value="90_days">Last 90 days</option>
    </select>
  );

  function summaryCard(label, value, sub, accent = "text-gray-900") {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-3 sm:p-4">
        <p className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">
          {label}
        </p>
        <p className={`text-lg sm:text-2xl font-extrabold ${accent}`}>
          {value}
        </p>
        {sub && <p className="hidden sm:block text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">
            Applications
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {isLoadingApplications
              ? "Loading…"
              : `${total} application${total !== 1 ? "s" : ""} total`}
          </p>
        </div>
        <button
          onClick={() => createNationalities()}
          disabled={isCreatingNationalities}
          className="hidden sm:inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
          title="Fetch nationalities from WIS and save to database"
        >
          <RefreshCw
            size={13}
            className={isCreatingNationalities ? "animate-spin" : ""}
          />
          {isCreatingNationalities ? "Refreshing…" : "Refresh Nationalities"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
        {isLoadingSummary ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-2xl p-3 sm:p-4 animate-pulse"
            >
              <div className="h-3 w-24 bg-gray-100 rounded mb-3" />
              <div className="h-8 w-16 bg-gray-100 rounded mb-2" />
              <div className="hidden sm:block h-3 w-28 bg-gray-100 rounded" />
            </div>
          ))
        ) : (
          <>
            {summaryCard(
              "Total Applications",
              String(summary?.totalApplications ?? 0),
              "Across all payment states",
            )}
            {summaryCard(
              "Paid Revenue",
              `${summary?.totalRevenue?.currency ?? "AED"} ${Number(summary?.totalRevenue?.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              "Confirmed paid policies",
              "text-green-700",
            )}
            {summaryCard(
              "Pending Review",
              String(summary?.pendingApplications ?? 0),
              "Applications awaiting outcome",
              "text-blue-700",
            )}
            {summaryCard(
              "Failed / Refunded",
              String(
                (summary?.failedApplications ?? 0) +
                  (summary?.refundedApplications ?? 0),
              ),
              "Requires operations follow-up",
              "text-red-700",
            )}
          </>
        )}
      </div>

      {/* Search + filter button, in one row */}
      <div className="flex items-center gap-2 w-full sm:max-w-sm">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search by email, name, session, policy..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300"
          />
        </div>
        <button
          onClick={() => setFiltersOpen(true)}
          title="Filters"
          className="relative shrink-0 inline-flex items-center justify-center p-2.5 border border-gray-200 rounded-xl bg-white text-gray-500 hover:text-gray-700 hover:border-gray-300 transition"
        >
          <SlidersHorizontal size={16} />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold text-white bg-primary-600 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter modal — same controls on every screen. Bottom sheet. */}
      {filtersOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
          onClick={() => setFiltersOpen(false)}
        >
          <div
            className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 space-y-5 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Filters</h3>
              <button
                onClick={() => setFiltersOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Payment status
              </label>
              {paymentControl("w-full")}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Journey
              </label>
              {journeyControl("w-full")}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Time
              </label>
              {timeControl("w-full")}
            </div>

            <button
              onClick={() => setFiltersOpen(false)}
              className="w-full py-2.5 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition"
            >
              Done
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {isLoadingApplications ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={22} className="animate-spin text-gray-300" />
          </div>
        ) : applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <ClipboardList size={22} className="text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-600">
                No applications found
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Try adjusting the filters above.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[860px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    {[
                      "Lead Passenger",
                      "Email",
                      "Region",
                      "Journey",
                      "Dates",
                      "Amount",
                      "Status",
                      "Created",
                      "",
                    ].map((h, i) => (
                      <th
                        key={i}
                        className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-4 py-3 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {applications.map((app) => (
                    <tr
                      key={app.sessionId}
                      className="hover:bg-gray-50/60 transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/insurance-applications/${app.sessionId}`}
                          className="font-semibold text-gray-900 leading-snug hover:text-primary-700 hover:underline transition-colors"
                        >
                          {leadName(app)}
                        </Link>
                        {app.policyNumber && (
                          <p className="text-xs text-gray-400 font-mono mt-0.5">
                            {app.policyNumber}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-600 max-w-[160px] truncate">
                        {app.email}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {app.region?.name ?? "—"}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <JourneyBadge type={app.journeyType} />
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {fmtDate(app.startDate)} → {fmtDate(app.endDate)}
                      </td>

                      <td className="px-4 py-3 text-sm font-semibold text-gray-700 whitespace-nowrap">
                        {fmtAmount(app.amountPaid)}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <PaymentBadge status={app.paymentStatus} />
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
                        {fmtDate(app.createdAt)}
                      </td>

                      <td className="px-4 py-3 w-20">
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/admin/insurance-applications/${app.sessionId}`}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-700 hover:bg-primary-50 transition"
                            title="View details"
                          >
                            <ArrowUpRight size={14} />
                          </Link>
                          <button
                            onClick={() =>
                              deleteInsuranceApplication(app.sessionId)
                            }
                            disabled={isDeleting || app.paymentStatus === "PAID"}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
                            title={
                              app.paymentStatus === "PAID"
                                ? "Cannot delete paid applications"
                                : "Delete"
                            }
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-sm text-gray-400">
                  Page {page} of {totalPages} · {total} total
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => goToPage(page - 1)}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-primary-300 hover:text-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => goToPage(page + 1)}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-primary-300 hover:text-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminInsuranceApplicationsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 size={24} className="animate-spin text-gray-300" />
        </div>
      }
    >
      <ApplicationsContent />
    </Suspense>
  );
}
