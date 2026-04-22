'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, Loader2, AlertCircle, Trash2, Check, Pencil, Undo,
  Mail, Phone, MapPin, CreditCard, Hash, Plane, Users, Calendar,
  MessageSquare, ExternalLink,
} from 'lucide-react';
import { MdWhatsapp } from 'react-icons/md';
import { useGetDummyTicket }    from '@travel-suite/frontend-shared/hooks/dummy-tickets/useGetDummyTicket';
import { useDeleteDummyTicket } from '@travel-suite/frontend-shared/hooks/dummy-tickets/useDeleteDummyTicket';
import { useRefundDummyTicket } from '@travel-suite/frontend-shared/hooks/dummy-tickets/useRefundDummyTicket';
import { useUpdateDummyTicket } from '@travel-suite/frontend-shared/hooks/dummy-tickets/useUpdateDummyTicket';
import { convertToDubaiTime, convertToDubaiDate, formatDate } from '@travel-suite/frontend-shared/utils/dates';
import { extractIataCode } from '@travel-suite/frontend-shared/utils/extractIataCode';
import { formatAmount } from '@travel-suite/frontend-shared/utils/currency';

/* --- Badges ------------------------------------------------------------------ */

const PAYMENT_CFG = {
  PAID:     { dot: 'bg-green-500', cls: 'bg-green-50  text-green-700  border-green-200'  },
  UNPAID:   { dot: 'bg-amber-400', cls: 'bg-amber-50  text-amber-700  border-amber-200'  },
  REFUNDED: { dot: 'bg-gray-400',  cls: 'bg-gray-100  text-gray-600   border-gray-200'   },
};

const ORDER_CFG = {
  PENDING:   { dot: 'bg-amber-400', cls: 'bg-amber-50  text-amber-700  border-amber-200'  },
  PROGRESS:  { dot: 'bg-blue-400',  cls: 'bg-blue-50   text-blue-700   border-blue-200'   },
  DELIVERED: { dot: 'bg-green-500', cls: 'bg-green-50  text-green-700  border-green-200'  },
};

function PaymentBadge({ status }) {
  const cfg = PAYMENT_CFG[status] ?? { dot: 'bg-gray-400', cls: 'bg-gray-100 text-gray-500 border-gray-200' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.cls}`}>
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      {status ?? '—'}
    </span>
  );
}

function OrderBadge({ status }) {
  const cfg = ORDER_CFG[status] ?? { dot: 'bg-gray-400', cls: 'bg-gray-100 text-gray-500 border-gray-200' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.cls}`}>
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      {status ?? '—'}
    </span>
  );
}

/* --- UI primitives ----------------------------------------------------------- */

function Card({ title, icon: Icon, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100">
        {Icon && <Icon size={14} className="text-gray-400 shrink-0" />}
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, mono }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-400 shrink-0">{label}</span>
      <span className={`text-sm font-semibold text-gray-800 text-right break-all ${mono ? 'font-mono' : ''}`}>
        {value ?? '—'}
      </span>
    </div>
  );
}

/* --- Passengers table -------------------------------------------------------- */

function PassengersTable({ passengers }) {
  if (!passengers?.length) {
    return <p className="text-xs text-gray-400 text-center py-4">No passenger data.</p>;
  }
  return (
    <div className="overflow-x-auto -mx-5">
      <table className="w-full text-sm min-w-[400px]">
        <thead>
          <tr className="bg-gray-50/60">
            {['#', 'Name', 'DOB', 'Passport'].map((h, i) => (
              <th key={i} className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-2.5 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {passengers.map((p, i) => (
            <tr key={i} className="hover:bg-gray-50/40">
              <td className="px-5 py-2.5 text-gray-400 font-medium">{i + 1}</td>
              <td className="px-5 py-2.5 font-semibold text-gray-800 capitalize">
                {[p.title, [p.firstName, p.lastName].filter(Boolean).join(' - ')].filter(Boolean).join(' ') || '—'}
              </td>
              <td className="px-5 py-2.5 text-gray-600">{p.dob ?? '—'}</td>
              <td className="px-5 py-2.5 font-mono text-gray-500">{p.passport ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* --- Delete section ---------------------------------------------------------- */

function DeleteSection({ sessionId, disabled }) {
  const [confirm, setConfirm] = useState(false);
  const { deleteDummyTicket, isDeleting } = useDeleteDummyTicket();

  if (disabled) {
    return (
      <p className="text-xs text-gray-400 text-center py-1">Paid tickets cannot be deleted.</p>
    );
  }

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 rounded-xl transition"
      >
        <Trash2 size={13} /> Delete Ticket
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
      <p className="text-xs font-semibold text-red-700">
        This permanently deletes the ticket and all associated data. This cannot be undone.
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => deleteDummyTicket(sessionId)}
          disabled={isDeleting}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-60"
        >
          {isDeleting && <Loader2 size={11} className="animate-spin" />}
          Confirm Delete
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="flex-1 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/* --- Page -------------------------------------------------------------------- */

export default function DummyTicketDetailPage() {
  const { sessionId } = useParams();

  const { dummyTicket: ticket, isLoadingDummyTicket } = useGetDummyTicket(sessionId);
  const { updateDummyTicket, isUpdating }              = useUpdateDummyTicket();
  const { refundDummyTicket, isRefunding }             = useRefundDummyTicket();

  /* -- Loading --------------------------------------------------- */
  if (isLoadingDummyTicket) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 size={28} className="animate-spin" />
          <p className="text-sm font-medium">Loading ticket…</p>
        </div>
      </div>
    );
  }

  /* -- Not found ------------------------------------------------- */
  if (!ticket) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center max-w-xs">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
            <AlertCircle size={24} className="text-red-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-700">Ticket not found</p>
            <p className="text-xs text-gray-400 mt-1">This ticket may have been deleted.</p>
          </div>
          <Link href="/admin/dummy-tickets" className="flex items-center gap-1.5 text-xs font-semibold text-primary-700 hover:underline">
            <ArrowLeft size={13} /> Back to dummy tickets
          </Link>
        </div>
      </div>
    );
  }

  /* -- WhatsApp share -------------------------------------------- */
  function handleShareWhatsApp() {
    const fromCode = extractIataCode(ticket?.from);
    const toCode   = extractIataCode(ticket?.to);
    const depFlight = ticket?.flightDetails?.departureFlight?.segments?.[0];
    const retFlight = ticket?.flightDetails?.returnFlight?.segments?.[0];
    const isReturn  = ticket?.type?.toLowerCase() === 'return';

    const lines = [
      `From: ${ticket?.from ?? ''} (${fromCode ?? '-'})`,
      `To: ${ticket?.to ?? ''} (${toCode ?? '-'})`,
      `Departure: ${ticket?.departureDate ? formatDate(ticket.departureDate) : '-'}`,
      ...(isReturn && ticket?.returnDate ? [`Return: ${formatDate(ticket.returnDate)}`] : []),
      '',
      `Departure Flight: ${depFlight ? `${depFlight.carrierCode} ${depFlight.flightNumber}` : '-'}`,
      ...(isReturn && retFlight ? [`Return Flight: ${retFlight.carrierCode} ${retFlight.flightNumber}`] : []),
      '',
      'Passengers:',
      ...(ticket?.passengers?.map((p, i) =>
        `${i + 1}. ${[p.title, [p.firstName, p.lastName].filter(Boolean).join(' - ')].filter(Boolean).join(' ')}`,
      ) ?? ['-']),
      '',
      `Ticket Validity: ${ticket?.ticketValidity ?? '-'}`,
      `Delivery: ${ticket?.ticketDelivery?.immediate ? 'Immediate' : ticket?.ticketDelivery?.deliveryDate ? formatDate(ticket.ticketDelivery.deliveryDate) : '-'}`,
      '',
      `Email: ${ticket?.email ?? '-'}`,
      `Mobile: ${ticket?.phoneNumber?.code ? `${ticket.phoneNumber.code}-${ticket.phoneNumber.digits}` : '-'}`,
      ...(ticket?.message ? ['', `Message: *${ticket.message}*`] : []),
    ];
    window.open(`https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`);
  }

  const isActionLoading = isUpdating || isRefunding;
  const depFlight = ticket?.flightDetails?.departureFlight?.segments?.[0];
  const retFlight = ticket?.flightDetails?.returnFlight?.segments?.[0];
  const isReturn  = ticket?.type?.toLowerCase() === 'return';

  return (
    <div className="max-w-7xl mx-auto space-y-5">

      {/* -- Page header -------------------------------------------- */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/dummy-tickets"
            className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 transition"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-extrabold text-gray-900 capitalize">
                {String(ticket?.leadPassenger ?? '—').toLowerCase()}
              </h2>
              <PaymentBadge status={ticket?.paymentStatus} />
              <OrderBadge  status={ticket?.orderStatus}   />
            </div>
            <p className="text-[11px] text-gray-400 font-mono mt-0.5">
              Session: {ticket?.sessionId}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {ticket?.orderStatus !== 'DELIVERED' && (
            <button
              onClick={() => updateDummyTicket({ sessionId, orderStatus: 'DELIVERED' })}
              disabled={isActionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 rounded-xl transition disabled:opacity-50"
            >
              <Check size={13} /> Mark Delivered
            </button>
          )}
          {ticket?.orderStatus !== 'PROGRESS' && (
            <button
              onClick={() => updateDummyTicket({ sessionId, orderStatus: 'PROGRESS' })}
              disabled={isActionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition disabled:opacity-50"
            >
              <Pencil size={13} /> Mark Progress
            </button>
          )}
          {ticket?.orderStatus !== 'PENDING' && (
            <button
              onClick={() => updateDummyTicket({ sessionId, orderStatus: 'PENDING' })}
              disabled={isActionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl transition disabled:opacity-50"
            >
              <Pencil size={13} /> Mark Pending
            </button>
          )}
          <button
            onClick={handleShareWhatsApp}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 rounded-xl transition"
          >
            <MdWhatsapp size={14} className="text-green-500" /> WhatsApp
          </button>
          {ticket?.paymentStatus === 'PAID' && ticket?.transactionId && (
            <button
              onClick={() => refundDummyTicket(ticket?.transactionId)}
              disabled={isActionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 rounded-xl transition disabled:opacity-50"
            >
              <Undo size={13} /> Refund
            </button>
          )}
        </div>
      </div>

      {/* -- Two-column body ----------------------------------------- */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-5 items-start">

        {/* Main column */}
        <div className="space-y-5">

          {/* Passengers */}
          <Card title="Passengers" icon={Users}>
            <PassengersTable passengers={ticket?.passengers} />
          </Card>

          {/* Contact */}
          <Card title="Contact Information" icon={Mail}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Mail size={12} className="text-gray-400" />
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Email</span>
                </div>
                <p className="text-sm font-semibold text-gray-800 break-all">{ticket?.email ?? '—'}</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Phone size={12} className="text-gray-400" />
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Phone</span>
                </div>
                <p className="text-sm font-semibold text-gray-800">
                  {ticket?.phoneNumber?.code && ticket?.phoneNumber?.digits
                    ? `+${ticket.phoneNumber.code} ${ticket.phoneNumber.digits}`
                    : '—'}
                </p>
              </div>
            </div>
            {ticket?.message && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-1.5 mb-2">
                  <MessageSquare size={12} className="text-gray-400" />
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Message</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{ticket.message}</p>
              </div>
            )}
          </Card>

          {/* Trip details */}
          <Card title="Trip Details" icon={Plane}>
            <InfoRow label="From"       value={ticket?.from} />
            <InfoRow label="To"         value={ticket?.to} />
            <InfoRow label="Type"       value={ticket?.type} />
            <InfoRow label="Departure"  value={ticket?.departureDate ? formatDate(ticket.departureDate) : '—'} />
            {isReturn && (
              <InfoRow label="Return" value={ticket?.returnDate ? formatDate(ticket.returnDate) : '—'} />
            )}
            <InfoRow label="Dep. Flight"
              value={depFlight ? `${depFlight.carrierCode ?? ''} ${depFlight.flightNumber ?? ''}`.trim() : '—'} />
            {isReturn && (
              <InfoRow label="Ret. Flight"
                value={retFlight ? `${retFlight.carrierCode ?? ''} ${retFlight.flightNumber ?? ''}`.trim() : '—'} />
            )}
            <InfoRow label="Validity"  value={ticket?.ticketValidity} />
            <InfoRow label="Delivery"
              value={ticket?.ticketDelivery?.immediate
                ? 'Immediate'
                : ticket?.ticketDelivery?.deliveryDate
                  ? convertToDubaiDate(ticket.ticketDelivery.deliveryDate)
                  : '—'} />
          </Card>

          {/* Affiliate */}
          {(ticket?.affiliate || ticket?.affiliateId) && (
            <Card title="Affiliate" icon={ExternalLink}>
              <InfoRow label="Affiliate ID"  value={ticket?.affiliate?.affiliateId || ticket?.affiliateId} mono />
              <InfoRow label="Name"          value={ticket?.affiliate?.name} />
              <InfoRow label="Email"         value={ticket?.affiliate?.email} />
              <InfoRow label="Commission"
                value={ticket?.affiliate?.commissionPercent !== undefined
                  ? `${ticket.affiliate.commissionPercent}%`
                  : '—'} />
              <InfoRow label="Status"
                value={ticket?.affiliate?.isActive ? 'Active' : ticket?.affiliate ? 'Inactive' : '—'} />
              {ticket?.affiliate?._id && (
                <div className="pt-3">
                  <Link
                    href={`/admin/affiliates/${ticket.affiliate._id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 hover:underline"
                  >
                    Open affiliate <ExternalLink size={11} />
                  </Link>
                </div>
              )}
            </Card>
          )}

        </div>

        {/* Sidebar */}
        <div className="space-y-4 xl:sticky xl:top-6">

          {/* Payment */}
          <Card title="Payment" icon={CreditCard}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <PaymentBadge status={ticket?.paymentStatus} />
              </div>
              {ticket?.amountPaid?.amount && (
                <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                  <span className="text-sm text-gray-500">Amount</span>
                  <span className="text-sm font-bold text-gray-900">
                    {ticket.amountPaid.currency} {formatAmount(ticket.amountPaid.amount)}
                  </span>
                </div>
              )}
              {ticket?.transactionId && (
                <div className="flex items-start justify-between border-t border-gray-50 pt-3 gap-2">
                  <span className="text-sm text-gray-500 shrink-0">Transaction</span>
                  <span className="text-[11px] font-mono text-gray-600 break-all text-right">{ticket.transactionId}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Order status */}
          <Card title="Order Status" icon={MapPin}>
            <div className="flex flex-col gap-2">
              {['PENDING', 'PROGRESS', 'DELIVERED'].map((status) => (
                <button
                  key={status}
                  onClick={() => updateDummyTicket({ sessionId, orderStatus: status })}
                  disabled={isUpdating || ticket?.orderStatus === status}
                  className={`w-full py-2 text-xs font-semibold rounded-xl border transition ${
                    ticket?.orderStatus === status
                      ? 'bg-gray-900 text-white border-gray-900 cursor-default'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </Card>

          {/* Handled by */}
          <Card title="Record" icon={Hash}>
            <InfoRow label="Handled By"  value={ticket?.handledBy?.name} />
            <InfoRow label="Submitted"   value={`${convertToDubaiDate(ticket?.createdAt)} ${convertToDubaiTime(ticket?.createdAt)}`} />
            <InfoRow label="Updated"     value={`${convertToDubaiDate(ticket?.updatedAt)} ${convertToDubaiTime(ticket?.updatedAt)}`} />
            <InfoRow label="Session"     value={ticket?.sessionId} mono />
          </Card>

          {/* Danger zone */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Danger Zone</p>
            </div>
            <div className="p-5">
              <DeleteSection
                sessionId={ticket?.sessionId}
                disabled={ticket?.paymentStatus === 'PAID'}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
