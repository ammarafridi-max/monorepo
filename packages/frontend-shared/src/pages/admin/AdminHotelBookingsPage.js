"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import {
  BedDouble,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowUpRight,
  SlidersHorizontal,
} from "lucide-react";
import { useHotelBookings } from "../../hooks/hotel-bookings/useHotelBookings";
import AdminSearchInput from "../../components/admin/AdminSearchInput";
import SourceBadge from "../../components/admin/SourceBadge";
import { convertToDubaiDate } from "../../utils/dates";
import { fmtDate } from '../../components/admin/format';
import { useAdminListParams } from '../../hooks/admin/useAdminListParams';
import { Sheet } from '../../components/admin/ModalShell';
import { Pagination } from '../../components/admin/Pagination';
import { AdminSuspense } from '../../components/admin/AdminSuspense';

const PAYMENT_TABS = [
  { value: "PAID", label: "Paid" },
  { value: "UNPAID", label: "Unpaid" },
  { value: "REFUNDED", label: "Refunded" },
];

const ORDER_TABS = [
  { value: "PENDING", label: "Pending" },
  { value: "PROGRESS", label: "In progress" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "REFUNDED", label: "Refunded" },
];

const PAYMENT_CFG = {
  PAID:               { dot: 'bg-green-500',  cls: 'bg-green-50  text-green-700  border-green-200'  },
  UNPAID:             { dot: 'bg-amber-400',  cls: 'bg-amber-50  text-amber-700  border-amber-200'  },
  REFUNDED:           { dot: 'bg-gray-400',   cls: 'bg-gray-100  text-gray-600   border-gray-200'   },
  PARTIALLY_REFUNDED: { dot: 'bg-orange-400', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
};

function PaymentBadge({ status }) {
  const cfg = PAYMENT_CFG[status] ?? { dot: 'bg-gray-400', cls: 'bg-gray-100 text-gray-500 border-gray-200' };
  const label = String(status ?? '—').replace(/_/g, ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase());
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {label}
    </span>
  );
}

const ORDER_CFG = {
  PENDING: { dot: "bg-amber-400", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  PROGRESS: { dot: "bg-green-500", cls: "bg-green-50 text-green-700 border-green-200" },
  DELIVERED: { dot: "bg-blue-400", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  REFUNDED: { dot: "bg-gray-400", cls: "bg-gray-100 text-gray-600 border-gray-200" },
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

function ReservationsContent() {
  const { reservations = [], pagination, isLoadingReservations } = useHotelBookings();

  const {
    params,
    page,
    search: localSearch,
    setSearch: setLocalSearch,
    setParam,
    goToPage,
    activeFilterCount,
  } = useAdminListParams({
    defaults: { search: "", paymentStatus: "", orderStatus: "", createdAt: "" },
    method: "replace",
    scroll: false,
    debounceMs: 350,
  });

  const totalPages = pagination?.totalPages ?? 1;
  const total = pagination?.total ?? 0;

  const [filtersOpen, setFiltersOpen] = useState(false);
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
        <Sheet
          size="md"
          title="Filters"
          titleClass="text-base font-bold text-gray-900"
          spacing="space-y-5"
          maxHeight="max-h-[85vh]"
          onClose={() => setFiltersOpen(false)}
        >

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Payment status</label>
              {selectControl(
                params.paymentStatus,
                (v) => setParam("paymentStatus", v),
                "All payment states",
                PAYMENT_TABS,
                "w-full",
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Order status</label>
              {selectControl(
                params.orderStatus,
                (v) => setParam("orderStatus", v),
                "All statuses",
                ORDER_TABS,
                "w-full",
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Time</label>
              {selectControl(
                params.createdAt,
                (v) => setParam("createdAt", v),
                "All time",
                [
                  { value: "4_hours", label: "Last 4 hours" },
                  { value: "24_hours", label: "Last 24 hours" },
                  { value: "7_days", label: "Last 7 days" },
                ],
                "w-full",
              )}
            </div>
        </Sheet>
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
                    {["Lead Guest", "Email", "Hotel", "Stay", "Handled By", "Payment", "Order", "Source", "Date", ""].map((h, i) => (
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

                      </td>

                      <td className="px-4 py-3 text-sm text-gray-600 max-w-[160px] truncate">{r.email}</td>

                      <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">
                        {r.hotel?.name ?? r.destination?.cityName ?? "—"}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {fmtDate(r.checkIn)} → {fmtDate(r.checkOut)}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {r.handledBy?.name ? r.handledBy.name.split(' ')[0] : '—'}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <PaymentBadge status={r.paymentStatus} />
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <OrderBadge status={r.orderStatus} />
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <SourceBadge attribution={r.attribution} />
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
                        {convertToDubaiDate(r.paidAt || r.createdAt)}
                      </td>

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

            <Pagination page={page} totalPages={totalPages} total={total} onPageChange={goToPage} />
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminHotelBookingsPage() {
  return (
    <AdminSuspense>
      <ReservationsContent />
    </AdminSuspense>
  );
}
