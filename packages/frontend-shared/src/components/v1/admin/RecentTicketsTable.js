import Link from "next/link";
import { Ticket, ArrowRight } from "lucide-react";
import { extractIataCode } from '../../../utils/extractIataCode.js';
import { convertToDubaiDate } from '../../../utils/dates.js';

function PaymentBadge({ status }) {
  const cfg =
    {
      PAID: {
        label: "Paid",
        cls: "bg-green-50 text-green-700 border-green-200",
        dot: "bg-green-500",
      },
      UNPAID: {
        label: "Unpaid",
        cls: "bg-amber-50 text-amber-700 border-amber-200",
        dot: "bg-amber-400",
      },
      REFUNDED: {
        label: "Refunded",
        cls: "bg-gray-100 text-gray-600 border-gray-200",
        dot: "bg-gray-400",
      },
    }[status] || {
      label: status || "—",
      cls: "bg-gray-100 text-gray-600 border-gray-200",
      dot: "bg-gray-400",
    };

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-bold border px-2 py-0.5 rounded-full ${cfg.cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full inline-block ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function OrderBadge({ status }) {
  const cfg =
    {
      DELIVERED: {
        label: "Delivered",
        cls: "bg-green-50 text-green-700 border-green-200",
        dot: "bg-green-500",
      },
      PROGRESS: {
        label: "Progress",
        cls: "bg-amber-50 text-amber-700 border-amber-200",
        dot: "bg-amber-400",
      },
      PENDING: {
        label: "Pending",
        cls: "bg-red-50 text-red-700 border-red-200",
        dot: "bg-red-400",
      },
    }[status] || {
      label: status || "—",
      cls: "bg-gray-100 text-gray-600 border-gray-200",
      dot: "bg-gray-400",
    };

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-bold border px-2 py-0.5 rounded-full ${cfg.cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full inline-block ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export default function RecentTicketsTable({ tickets = [] }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <p className="font-bold text-gray-900 text-sm">Recent Tickets</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Latest dummy ticket orders
          </p>
        </div>
        <Link
          href="/admin/dummy-tickets"
          className="flex items-center gap-1.5 text-xs font-semibold text-primary-700 hover:underline"
        >
          View all
          <ArrowRight size={12} />
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
            <Ticket size={20} className="text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-500">No tickets yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Orders will appear here once customers start booking.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {[
                  "Passenger",
                  "Route",
                  "Type",
                  "Payment",
                  "Status",
                  "Date",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wide px-5 py-3 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tickets.map((ticket) => (
                <tr
                  key={ticket._id ?? ticket.sessionId}
                  className="hover:bg-gray-50/60 transition-colors"
                >
                  <td className="px-5 py-3.5 font-medium text-gray-900 whitespace-nowrap">
                    <Link
                      href={`/admin/dummy-tickets/${ticket.sessionId}`}
                      className="hover:text-primary-700 hover:underline capitalize"
                    >
                      {ticket.leadPassenger?.toLowerCase() ?? "—"}
                    </Link>
                    {ticket.passengers?.length > 1 && (
                      <span className="ml-1 text-[11px] text-gray-400">
                        +{ticket.passengers.length - 1}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap font-medium">
                    {extractIataCode(ticket.from)} →{" "}
                    {extractIataCode(ticket.to)}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap text-xs">
                    {ticket.type ?? "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <PaymentBadge status={ticket.paymentStatus} />
                  </td>
                  <td className="px-5 py-3.5">
                    <OrderBadge status={ticket.orderStatus} />
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap text-xs">
                    {ticket.createdAt
                      ? convertToDubaiDate(ticket.createdAt)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
