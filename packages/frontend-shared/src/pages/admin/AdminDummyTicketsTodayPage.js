"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowUpRight,
  CalendarCheck,
} from "lucide-react";
import { FaPaypal } from "react-icons/fa";
import { getDummyTicketsApi } from "../../services/apiDummyTickets.js";
import { extractIataCode } from "../../utils/extractIataCode";
import { convertToDubaiDate } from "../../utils/dates";

const PAYMENT_CFG = {
  PAID: {
    dot: "bg-green-500",
    cls: "bg-green-50  text-green-700  border-green-200",
  },
  UNPAID: {
    dot: "bg-amber-400",
    cls: "bg-amber-50  text-amber-700  border-amber-200",
  },
  REFUNDED: {
    dot: "bg-gray-400",
    cls: "bg-gray-100  text-gray-600   border-gray-200",
  },
};

const ORDER_CFG = {
  PENDING: {
    dot: "bg-amber-400",
    cls: "bg-amber-50  text-amber-700  border-amber-200",
  },
  PROGRESS: {
    dot: "bg-blue-400",
    cls: "bg-blue-50   text-blue-700   border-blue-200",
  },
  DELIVERED: {
    dot: "bg-green-500",
    cls: "bg-green-50  text-green-700  border-green-200",
  },
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
      {status ?? "—"}
    </span>
  );
}

function OrderBadge({ status }) {
  const cfg = ORDER_CFG[status] ?? {
    dot: "bg-gray-400",
    cls: "bg-gray-100 text-gray-500 border-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status ?? "—"}
    </span>
  );
}

function TodayDeliveriesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page") || 1);

  const params = { deliveryDate: "today", page };

  const { data, isLoading } = useQuery({
    queryKey: ["dummytickets-today", page],
    queryFn: () => getDummyTicketsApi(params),
    placeholderData: (prev) => prev,
  });

  const dummyTickets = data?.data ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;
  const total = pagination?.total ?? 0;

  function goToPage(p) {
    const ps = new URLSearchParams(searchParams.toString());
    ps.set("page", String(p));
    router.push(`?${ps.toString()}`);
  }

  const todayLabel = new Date().toLocaleDateString("en-GB", {
    timeZone: "Asia/Dubai",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">
            Today's Deliveries
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {isLoading
              ? "Loading…"
              : `${total} ticket${total !== 1 ? "s" : ""} scheduled for delivery today · ${todayLabel}`}
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={22} className="animate-spin text-gray-300" />
          </div>
        ) : dummyTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <CalendarCheck size={22} className="text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-600">
                No deliveries scheduled for today
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Check back later or view all tickets.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    {[
                      "Passenger",
                      "Email",
                      "Route",
                      "Type",
                      "Delivery",
                      "Handled By",
                      "Payment",
                      "Order",
                      "Date",
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
                  {dummyTickets.map((item) => (
                    <tr
                      key={item?.sessionId || item?._id}
                      className="hover:bg-gray-50/60 transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900 capitalize leading-snug">
                          {String(item?.leadPassenger ?? "—").toLowerCase()}
                        </p>
                        {item?.passengers?.length > 1 && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            +{item.passengers.length - 1} more
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-600 max-w-[160px] truncate">
                        {item?.email ?? "—"}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-700 font-semibold whitespace-nowrap">
                        {extractIataCode(item?.from)} →{" "}
                        {extractIataCode(item?.to)}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap capitalize">
                        {item?.type ?? "—"}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {item?.ticketDelivery?.immediate
                          ? "Immediate"
                          : item?.ticketDelivery?.deliveryDate
                            ? convertToDubaiDate(
                                item.ticketDelivery.deliveryDate,
                              )
                            : "—"}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {item?.handledBy?.name
                          ? item.handledBy.name.split(" ")[0]
                          : "—"}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <PaymentBadge status={item?.paymentStatus} />
                          {item?.paymentStatus === "PAID" &&
                            item?.paymentMethod === "paypal" && (
                              <FaPaypal
                                size={12}
                                className="text-[#009cde] ml-0.5"
                                title="PayPal"
                              />
                            )}
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <OrderBadge status={item?.orderStatus} />
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
                        {convertToDubaiDate(item?.updatedAt)}
                      </td>

                      <td className="px-4 py-3 w-20">
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/admin/dummy-tickets/${item?.sessionId}`}
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

export default function AdminDummyTicketsTodayPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 size={24} className="animate-spin text-gray-300" />
        </div>
      }
    >
      <TodayDeliveriesContent />
    </Suspense>
  );
}
