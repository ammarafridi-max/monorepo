"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BedDouble,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowUpRight,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useHotelBookings } from "../../hooks/hotel-bookings/useHotelBookings";
import AdminSearchInput from "../../components/admin/AdminSearchInput";

const ORDER_TABS = [
  { value: "PENDING", label: "Pending" },
  { value: "BOOKED", label: "Booked" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "BOOKING_FAILED", label: "Booking failed" },
  { value: "REFUNDED", label: "Refunded" },
];

const CANCELLATION_TABS = [
  { value: "NOT_BOOKED", label: "Not booked" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "FAILED", label: "Failed" },
];

const ORDER_CFG = {
  PENDING: { dot: "bg-amber-400", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  BOOKED: { dot: "bg-green-500", cls: "bg-green-50 text-green-700 border-green-200" },
  DELIVERED: { dot: "bg-blue-400", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  BOOKING_FAILED: { dot: "bg-red-500", cls: "bg-red-50 text-red-700 border-red-200" },
  REFUNDED: { dot: "bg-gray-400", cls: "bg-gray-100 text-gray-600 border-gray-200" },
};

const CANCELLATION_CFG = {
  NOT_BOOKED: "bg-gray-100 text-gray-500 border-gray-200",
  SCHEDULED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  CANCELLED: "bg-green-50 text-green-700 border-green-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
};

function OrderBadge({ status }) {
  const cfg = ORDER_CFG[status] ?? { dot: "bg-gray-400", cls: "bg-gray-100 text-gray-500 border-gray-200" };
  const label = ORDER_TABS.find((t) => t.value === status)?.label ?? status ?? "—";
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {label}
    </span>
  );
}

function CancellationBadge({ status, deadline }) {
  const cls = CANCELLATION_CFG[status] ?? "bg-gray-100 text-gray-500 border-gray-200";
  const label = CANCELLATION_TABS.find((t) => t.value === status)?.label ?? status ?? "—";
  const due = status === "SCHEDULED" && deadline ? daysUntil(deadline) : null;
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cls}`}>
      {label}
      {due !== null && ` · ${due}`}
    </span>
  );
}

function daysUntil(value) {
  const days = Math.ceil((new Date(value).getTime() - Date.now()) / 86_400_000);
  if (Number.isNaN(days)) return null;
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  return `${days}d`;
}

function fmtDate(str) {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtAmount(amountPaid) {
  if (!amountPaid?.amount) return "—";
  return `${amountPaid.currency ?? ""} ${Number(amountPaid.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`.trim();
}

function ReservationsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { reservations = [], pagination, isLoadingReservations } = useHotelBookings();

  const page = Number(searchParams.get("page") || 1);
  const totalPages = pagination?.totalPages ?? 1;
  const total = pagination?.total ?? 0;

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchParams.get("search") ?? "");
  const [localOrder, setLocalOrder] = useState(searchParams.get("orderStatus") ?? "");
  const [localCancellation, setLocalCancellation] = useState(searchParams.get("cancellationStatus") ?? "");
  const [localCreatedAt, setLocalCreatedAt] = useState(searchParams.get("createdAt") ?? "");

  function setParam(key, value) {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if ((searchParams.get("search") ?? "") !== localSearch) setParam("search", localSearch);
    }, 350);
    return () => clearTimeout(timer);
  }, [localSearch]);

  function goToPage(next) {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(next));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const activeFilterCount = [localOrder, localCancellation, localCreatedAt].filter(Boolean).length;
  const selectCls =
    "text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:border-primary-400";

  const selectControl = (value, onChange, placeholder, tabs, className = "") => (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={`${selectCls} ${className}`}>
      <option value="">{placeholder}</option>
      {tabs.map(({ value: v, label }) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">Hotel Reservations</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {isLoadingReservations ? "Loading…" : `${total} reservation${total !== 1 ? "s" : ""} total`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full">
        <AdminSearchInput
          value={localSearch}
          onChange={setLocalSearch}
          placeholder="Search by email, guest, hotel, booking ref..."
          className="flex-1 sm:max-w-sm"
        />
        <div className="flex-1" />
        <button
          onClick={() => setFiltersOpen(true)}
          title="Filters"
          aria-label="Filters"
          className="relative shrink-0 flex items-center text-gray-800 hover:text-black transition-colors"
        >
          <SlidersHorizontal size={18} />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-1 flex items-center justify-center text-[9px] font-bold text-white bg-primary-600 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

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
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Order status</label>
              {selectControl(
                localOrder,
                (v) => { setLocalOrder(v); setParam("orderStatus", v); },
                "All statuses",
                ORDER_TABS,
                "w-full",
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Cancellation</label>
              {selectControl(
                localCancellation,
                (v) => { setLocalCancellation(v); setParam("cancellationStatus", v); },
                "All cancellation states",
                CANCELLATION_TABS,
                "w-full",
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Time</label>
              {selectControl(
                localCreatedAt,
                (v) => { setLocalCreatedAt(v); setParam("createdAt", v); },
                "All time",
                [
                  { value: "4_hours", label: "Last 4 hours" },
                  { value: "24_hours", label: "Last 24 hours" },
                  { value: "7_days", label: "Last 7 days" },
                ],
                "w-full",
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {isLoadingReservations ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={22} className="animate-spin text-gray-300" />
          </div>
        ) : reservations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <BedDouble size={22} className="text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-600">No reservations found</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting the filters above.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[940px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    {["Lead Guest", "Email", "Hotel", "Stay", "Amount", "Order", "Cancellation", "Created", ""].map((h, i) => (
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
                  {reservations.map((r) => (
                    <tr key={r.sessionId} className="hover:bg-gray-50/60 transition-colors group">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/hotel-bookings/${r.sessionId}`}
                          className="font-semibold text-gray-900 leading-snug hover:text-primary-700 hover:underline transition-colors"
                        >
                          {r.leadGuest ?? "—"}
                        </Link>
                        {r.supplier?.hotelConfirmationCode && (
                          <p className="text-xs text-gray-400 font-mono mt-0.5">
                            {r.supplier.hotelConfirmationCode}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-600 max-w-[160px] truncate">{r.email}</td>

                      <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">
                        {r.hotel?.name ?? r.destination?.cityName ?? "—"}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {fmtDate(r.checkIn)} → {fmtDate(r.checkOut)}
                      </td>

                      <td className="px-4 py-3 text-sm font-semibold text-gray-700 whitespace-nowrap">
                        {fmtAmount(r.amountPaid)}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <OrderBadge status={r.orderStatus} />
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <CancellationBadge status={r.cancellationStatus} deadline={r.freeCancellationUntil} />
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">{fmtDate(r.createdAt)}</td>

                      <td className="px-4 py-3 w-14">
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/admin/hotel-bookings/${r.sessionId}`}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-700 hover:bg-primary-50 transition"
                            title="View details"
                          >
                            <ArrowUpRight size={14} />
                          </Link>
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

export default function AdminHotelBookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 size={24} className="animate-spin text-gray-300" />
        </div>
      }
    >
      <ReservationsContent />
    </Suspense>
  );
}
