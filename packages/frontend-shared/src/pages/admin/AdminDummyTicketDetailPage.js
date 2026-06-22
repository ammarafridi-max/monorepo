'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, Loader2, AlertCircle, Trash2, Check, Pencil, Undo,
  Mail, Phone, MapPin, CreditCard, Hash, Plane, Users, Calendar,
  MessageSquare, ExternalLink, ArrowRight,
} from 'lucide-react';
import { MdWhatsapp } from 'react-icons/md';
import { FaStripe, FaPaypal } from 'react-icons/fa';
import { useGetDummyTicket } from '../../hooks/dummy-tickets/useGetDummyTicket';
import { useDeleteDummyTicket } from '../../hooks/dummy-tickets/useDeleteDummyTicket';
import { useRefundDummyTicket } from '../../hooks/dummy-tickets/useRefundDummyTicket';
import { useUpdateDummyTicket } from '../../hooks/dummy-tickets/useUpdateDummyTicket';
import OrderPiPButton from '../../components/admin/v1/FloatingOrderPanel';
import { convertToDubaiTime, convertToDubaiDate, formatDate, formatTravelportDate } from '../../utils/dates';
import { extractIataCode } from '../../utils/extractIataCode';
import { formatAmount } from '../../utils/currency';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

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

// Travelport availability command, e.g. "A28MAYDXBCDG"
function buildAvailabilityCommand(dateString, fromIata, toIata) {
  const date = formatTravelportDate(dateString);
  if (!date || !fromIata || !toIata) return '';
  return `A${date}${fromIata}${toIata}`;
}

// Travelport name command, e.g. "N.SMITH/JOHN MR"
function buildPassengerCommand(p) {
  const last = (p?.lastName || '').trim().toUpperCase();
  const first = (p?.firstName || '').trim().toUpperCase();
  const title = (p?.title || '').trim().replace(/\.+$/, '').toUpperCase();
  if (!last && !first) return '';
  return `N.${last}/${first}${title ? ` ${title}` : ''}`;
}

function FlightCard({ dateString, fromIata, toIata, flightNumber }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4 flex flex-col gap-3">
      <span className="text-sm font-bold text-gray-900">{dateString || '—'}</span>
      <div className="flex items-center gap-2.5">
        <span className="text-xl font-extrabold text-gray-900">{fromIata || '—'}</span>
        <ArrowRight size={16} className="text-gray-300 shrink-0" />
        <span className="text-xl font-extrabold text-gray-900">{toIata || '—'}</span>
        {flightNumber && (
          <span className="ml-auto text-sm font-semibold text-gray-500">{flightNumber}</span>
        )}
      </div>
    </div>
  );
}

function PassengersTable({ passengers }) {
  if (!passengers?.length) {
    return <p className="text-xs text-gray-400 text-center py-4">No passenger data.</p>;
  }
  return (
    <div className="overflow-x-auto -mx-5">
      <table className="w-full text-sm min-w-[300px]">
        <thead>
          <tr className="bg-gray-50/60">
            {['#', 'Name'].map((h, i) => (
              <th key={i} className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-2.5 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {passengers.map((p, i) => (
            <tr key={i} className="hover:bg-gray-50/40">
              <td className="px-5 py-2.5 text-gray-400 font-medium align-middle">{i + 1}</td>
              <td className="px-5 py-2.5 font-semibold text-gray-800 capitalize align-middle">
                {[p.title, p.firstName, p.lastName].filter(Boolean).join(' ') || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DeleteSection({ sessionId, disabled, disabledReason }) {
  const [confirm, setConfirm] = useState(false);
  const { deleteDummyTicket, isDeleting } = useDeleteDummyTicket();

  if (disabled) {
    return (
      <p className="text-xs text-gray-400 text-center py-1">{disabledReason}</p>
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

export default function AdminDummyTicketDetailPage() {
  const { sessionId } = useParams();
  const { adminUser } = useAdminAuth();
  const isAgent = adminUser?.role === 'agent';

  const { dummyTicket: ticket, isLoadingDummyTicket } = useGetDummyTicket(sessionId);
  // Scheduled (non-immediate) deliveries shouldn't be markable as Progress
  // or Delivered until the scheduled day arrives. Delivery dates are stored
  // as YYYY-MM-DD-prefixed strings; today is formatted the same way in
  // Dubai time so lexical comparison works regardless of browser locale.
  const todayDubai = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai' }).format(new Date());
  const scheduledDate = ticket?.ticketDelivery?.immediate
    ? null
    : ticket?.ticketDelivery?.deliveryDate?.slice(0, 10) || null;
  const deliveryDayReached = !scheduledDate || todayDubai >= scheduledDate;
  const { updateDummyTicket, isUpdating }              = useUpdateDummyTicket();
  const { refundDummyTicket, isRefunding }             = useRefundDummyTicket();

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

  // Shape the ticket into the order contract the floating PiP panel expects.
  // Read-only — the panel renders whatever is here whenever `ticket` updates.
  const segmentToPanel = (s) => ({
    date: s?.departure?.date ? formatDate(s.departure.date) : '',
    from: s?.departure?.iataCode,
    to:   s?.arrival?.iataCode,
    flight: `${s?.carrierCode || ''} ${s?.flightNumber || ''}`.trim() || '—',
  });

  // Travelport availability commands: A{DD}{MMM}{FROM}{TO} for departure,
  // AR{DD}{MMM} for the return (AR inherits the previous availability's pair).
  const fromIata = extractIataCode(ticket?.from);
  const toIata   = extractIataCode(ticket?.to);
  const depAvail = buildAvailabilityCommand(ticket?.departureDate, fromIata, toIata);
  const retAvail = isReturn && ticket?.returnDate
    ? `AR${formatTravelportDate(ticket.returnDate)}`
    : '';

  // QEB queue placement command varies by ticket validity.
  const QEB_BY_VALIDITY = { '2 Days': '76', '7 Days': '77', '14 Days': '78' };
  const qebCode = QEB_BY_VALIDITY[ticket?.ticketValidity];

  // Agent reference for the P.T*REF field — pulled from the logged-in admin.
  const agentRef = (adminUser?.name || '').trim().split(/\s+/)[0].toUpperCase() || 'AGENT';

  const orderForPanel = ticket && {
    customerName: ticket.leadPassenger || '—',
    status: [ticket.paymentStatus, ticket.orderStatus].filter(Boolean),
    paymentMethod: ticket.paymentMethod === 'paypal' ? 'PayPal' : 'Stripe',
    recordLocator: ticket.pnr || '',
    type: ticket.type,
    validity: ticket.ticketValidity,
    delivery: ticket.ticketDelivery?.immediate
      ? 'Immediate'
      : ticket.ticketDelivery?.deliveryDate
        ? convertToDubaiDate(ticket.ticketDelivery.deliveryDate)
        : '—',
    segments: [
      ...(ticket.flightDetails?.departureFlight?.segments || []).map(segmentToPanel),
      ...(ticket.flightDetails?.returnFlight?.segments || []).map(segmentToPanel),
    ],
    availabilityCommands: [
      { label: isReturn ? 'AVAILABILITY · DEP' : 'AVAILABILITY', value: depAvail },
      { label: 'AVAILABILITY · RET',                              value: retAvail },
    ],
    passengers: (ticket.passengers || []).map((p) => ({
      name: [p.title, p.firstName, p.lastName].filter(Boolean).join(' '),
      travelport: buildPassengerCommand(p),
    })),
    bookingCommands: [
      { label: 'PHONE / AGENT REF', value: `P.T*REF ${agentRef}` },
      { label: 'TICKETING',         value: 'T.T*' },
      { label: 'RECEIVED FROM',     value: 'R.P' },
      { label: `QUEUE · ${ticket?.ticketValidity || ''}`.trim(), value: qebCode ? `QEB/${qebCode}` : '' },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">

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

        <div className="flex items-center gap-2 flex-wrap">
          <OrderPiPButton
            order={orderForPanel}
            label="Pop out overview"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {ticket?.paymentStatus === 'PAID' && (
            <>
              {deliveryDayReached && ticket?.orderStatus !== 'DELIVERED' && (
                <button
                  onClick={() => updateDummyTicket({ sessionId, orderStatus: 'DELIVERED' })}
                  disabled={isActionLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 rounded-xl transition disabled:opacity-50"
                >
                  <Check size={13} /> Mark Delivered
                </button>
              )}
              {deliveryDayReached && ticket?.orderStatus !== 'PROGRESS' && (
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
            </>
          )}
          <button
            onClick={handleShareWhatsApp}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 rounded-xl transition"
          >
            <MdWhatsapp size={14} className="text-green-500" /> WhatsApp
          </button>
          {!isAgent && ticket?.paymentStatus === 'PAID' && ticket?.transactionId && (
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

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-5 items-start">

        <div className="space-y-5">

          <Card title="Trip Details" icon={Plane}>
            <div className={`grid gap-4 ${isReturn ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
              <FlightCard
                dateString={ticket?.departureDate ? formatDate(ticket.departureDate) : ''}
                fromIata={extractIataCode(ticket?.from)}
                toIata={extractIataCode(ticket?.to)}
                flightNumber={depFlight ? `${depFlight.carrierCode ?? ''} ${depFlight.flightNumber ?? ''}`.trim() : ''}
              />
              {isReturn && (
                <FlightCard
                  dateString={ticket?.returnDate ? formatDate(ticket.returnDate) : ''}
                  fromIata={extractIataCode(ticket?.to)}
                  toIata={extractIataCode(ticket?.from)}
                  flightNumber={retFlight ? `${retFlight.carrierCode ?? ''} ${retFlight.flightNumber ?? ''}`.trim() : ''}
                />
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <InfoRow label="Type"     value={ticket?.type} />
              <InfoRow label="Validity" value={ticket?.ticketValidity} />
              <InfoRow label="Delivery"
                value={ticket?.ticketDelivery?.immediate
                  ? 'Immediate'
                  : ticket?.ticketDelivery?.deliveryDate
                    ? convertToDubaiDate(ticket.ticketDelivery.deliveryDate)
                    : '—'} />
            </div>
          </Card>

          <Card title="Passengers" icon={Users}>
            <PassengersTable passengers={ticket?.passengers} />
          </Card>

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
                    ? `${ticket.phoneNumber.code} ${ticket.phoneNumber.digits}`
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

        <div className="space-y-4 xl:sticky xl:top-6">

          <Card title="Payment" icon={CreditCard}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <PaymentBadge status={ticket?.paymentStatus} />
              </div>
              {ticket?.paymentMethod && ticket?.paymentStatus === 'PAID' && (
                <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                  <span className="text-sm text-gray-500">Method</span>
                  {ticket.paymentMethod === 'paypal' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#003087]">
                      <FaPaypal size={13} className="text-[#009cde]" /> PayPal
                    </span>
                  ) : (
                    <FaStripe size={28} className="text-[#635bff]" />
                  )}
                </div>
              )}
              {!isAgent && ticket?.amountPaid?.amount && (
                <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                  <span className="text-sm text-gray-500">Amount</span>
                  <span className="text-sm font-bold text-gray-900">
                    {ticket.amountPaid.currency} {formatAmount(ticket.amountPaid.amount)}
                  </span>
                </div>
              )}
              {!isAgent && ticket?.transactionId && (
                <div className="flex items-start justify-between border-t border-gray-50 pt-3 gap-2">
                  <span className="text-sm text-gray-500 shrink-0">Transaction</span>
                  <span className="text-[11px] font-mono text-gray-600 break-all text-right">{ticket.transactionId}</span>
                </div>
              )}
            </div>
          </Card>

          {ticket?.paymentStatus === 'PAID' && (
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
          )}

          <Card title="Record" icon={Hash}>
            <InfoRow label="Handled By"  value={ticket?.handledBy?.name} />
            <InfoRow label="Submitted"   value={`${convertToDubaiDate(ticket?.createdAt)} ${convertToDubaiTime(ticket?.createdAt)}`} />
            <InfoRow label="Updated"     value={`${convertToDubaiDate(ticket?.updatedAt)} ${convertToDubaiTime(ticket?.updatedAt)}`} />
            <InfoRow label="Session"     value={ticket?.sessionId} mono />
          </Card>

          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Danger Zone</p>
            </div>
            <div className="p-5">
              <DeleteSection
                sessionId={ticket?.sessionId}
                disabled={isAgent || ticket?.paymentStatus === 'PAID'}
                disabledReason={
                  isAgent
                    ? 'Only admins can delete tickets.'
                    : 'Paid tickets cannot be deleted.'
                }
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
