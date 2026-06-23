'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, Loader2, AlertCircle, Mail, Phone, MapPin, CreditCard, Hash,
  Plane, Users, Calendar, ExternalLink, FileText, Image as ImageIcon,
  FileDown, Paperclip, ArrowRight, AlertTriangle, Trash2,
} from 'lucide-react';
import { useItineraryOrderDetail } from '../../hooks/itineraries/useItineraryOrderDetail';
import { useDeleteItineraryOrder } from '../../hooks/itineraries/useDeleteItineraryOrder';
import { convertToDubaiDate, convertToDubaiTime } from '../../utils/dates';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

const PAYMENT_CFG = {
  PAID:     { dot: 'bg-green-500', cls: 'bg-green-50 text-green-700 border-green-200' },
  UNPAID:   { dot: 'bg-amber-400', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  REFUNDED: { dot: 'bg-gray-400',  cls: 'bg-gray-100 text-gray-600  border-gray-200'  },
};

const STATUS_CFG = {
  GENERATED:  { dot: 'bg-green-500', cls: 'bg-green-50 text-green-700 border-green-200' },
  GENERATING: { dot: 'bg-blue-400',  cls: 'bg-blue-50  text-blue-700  border-blue-200'  },
  DRAFT:      { dot: 'bg-gray-400',  cls: 'bg-gray-100 text-gray-600  border-gray-200'  },
  FAILED:     { dot: 'bg-red-400',   cls: 'bg-red-50   text-red-700   border-red-200'   },
};

function Badge({ status, cfgMap }) {
  const cfg = cfgMap[status] ?? { dot: 'bg-gray-400', cls: 'bg-gray-100 text-gray-500 border-gray-200' };
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

// A single Cloudinary document link.
function DocLink({ icon: Icon, label, href }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50/50 transition group"
    >
      <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center shrink-0">
        <Icon size={15} />
      </div>
      <span className="flex-1 text-sm font-semibold text-gray-700 group-hover:text-primary-800 truncate">{label}</span>
      <ExternalLink size={13} className="text-gray-300 group-hover:text-primary-600 shrink-0" />
    </a>
  );
}

function fmtTravelDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function DeleteSection({ sessionId, disabled, disabledReason }) {
  const [confirm, setConfirm] = useState(false);
  const { deleteItineraryOrder, isDeleting } = useDeleteItineraryOrder();

  if (disabled) {
    return <p className="text-xs text-gray-400 text-center py-1">{disabledReason}</p>;
  }

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 rounded-xl transition"
      >
        <Trash2 size={13} /> Delete Itinerary
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
      <p className="text-xs font-semibold text-red-700">
        This permanently deletes the itinerary and its documents from Cloudinary. This cannot be undone.
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => deleteItineraryOrder(sessionId)}
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

export default function AdminItineraryDetailPage() {
  const { sessionId } = useParams();
  const { adminUser } = useAdminAuth();
  const isAdmin = adminUser?.role === 'admin';
  const { order, isLoadingOrder } = useItineraryOrderDetail(sessionId);

  if (isLoadingOrder) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 size={28} className="animate-spin" />
          <p className="text-sm font-medium">Loading itinerary…</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center max-w-xs">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
            <AlertCircle size={24} className="text-red-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-700">Itinerary not found</p>
            <p className="text-xs text-gray-400 mt-1">This itinerary may have been deleted.</p>
          </div>
          <Link href="/admin/itineraries" className="flex items-center gap-1.5 text-xs font-semibold text-primary-700 hover:underline">
            <ArrowLeft size={13} /> Back to itineraries
          </Link>
        </div>
      </div>
    );
  }

  const input = order.input ?? {};
  const t = input.traveller ?? {};
  const days = Array.isArray(order.itineraryData?.days) ? order.itineraryData.days : [];
  const segments = Array.isArray(input.segments) ? input.segments : [];
  const supportingDocs = Array.isArray(order.supportingDocuments) ? order.supportingDocuments : [];
  const hasDocs = order.previewUrl || order.cleanPdfUrl || supportingDocs.length > 0;
  const route = input.arrival?.city === input.departure?.city
    ? `${input.arrival?.city ?? '—'}`
    : `${input.arrival?.city ?? '—'} → ${input.departure?.city ?? '—'}`;
  const amount = order.paymentStatus === 'PAID' && order.amountPaid?.amount
    ? `${order.amountPaid.currency} ${Number(order.amountPaid.amount).toLocaleString('en-US')}`
    : `${order.currency ?? 'AED'} ${order.price ?? '—'}`;

  return (
    <div className="max-w-7xl mx-auto space-y-5">

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/itineraries"
            className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 transition"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-extrabold text-gray-900 capitalize">
                {String(t.fullName || t.firstName || '—').toLowerCase()}
              </h2>
              <Badge status={order.status} cfgMap={STATUS_CFG} />
              <Badge status={order.paymentStatus} cfgMap={PAYMENT_CFG} />
            </div>
            <p className="text-[11px] text-gray-400 font-mono mt-0.5">Session: {order.sessionId}</p>
          </div>
        </div>
        <Link
          href={`/itinerary-booking/${order.sessionId}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 rounded-xl transition"
        >
          Open live preview <ExternalLink size={13} />
        </Link>
      </div>

      {order.status === 'FAILED' && order.lastError && (
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3">
          <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold">Generation failed</p>
            <p className="text-xs mt-0.5 break-words">{order.lastError}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5 items-start">

        <div className="space-y-5">

          <Card title="Trip Overview" icon={Plane}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <InfoRow label="Applying To" value={input.visaCountry} />
              <InfoRow label="From" value={input.fromCountry} />
              <InfoRow label="Purpose" value={input.purpose} />
              <InfoRow label="Travellers" value={input.travellers} />
              <InfoRow label="Route" value={route} />
              <InfoRow
                label="Travel Dates"
                value={input.startDate ? `${fmtTravelDate(input.startDate)} – ${fmtTravelDate(input.endDate)}` : '—'}
              />
              <InfoRow label="Flight reservation" value={input.reservations?.flight} />
              <InfoRow label="Hotel reservation" value={input.reservations?.hotel} />
            </div>
          </Card>

          {segments.length > 0 && (
            <Card title="Flight Segments" icon={MapPin}>
              <div className="space-y-2">
                {segments.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-gray-100 px-4 py-2.5">
                    <span className="text-xs font-mono text-gray-400 w-24 shrink-0">{fmtTravelDate(s.date)}</span>
                    <span className="text-sm font-semibold text-gray-800">{s.from?.city ?? '—'}</span>
                    <ArrowRight size={13} className="text-gray-300 shrink-0" />
                    <span className="text-sm font-semibold text-gray-800">{s.to?.city ?? '—'}</span>
                    <span className="ml-auto text-xs text-gray-400">{s.to?.country ?? ''}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card title="Day-by-Day Itinerary" icon={Calendar}>
            {days.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">Not generated yet.</p>
            ) : (
              <div className="overflow-x-auto -mx-5">
                <table className="w-full text-sm min-w-[480px]">
                  <thead>
                    <tr className="bg-gray-50/60">
                      {['Date', 'Location', 'Plan'].map((h, i) => (
                        <th key={i} className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide px-5 py-2.5 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {days.map((d, i) => (
                      <tr key={i} className="hover:bg-gray-50/40 align-top">
                        <td className="px-5 py-2.5 text-gray-500 whitespace-nowrap">{fmtTravelDate(d.date)}</td>
                        <td className="px-5 py-2.5 font-semibold text-gray-700 whitespace-nowrap">{d.city}, {d.country}</td>
                        <td className="px-5 py-2.5 text-gray-600">
                          {d.title && <span className="font-semibold text-gray-800">{d.title}</span>}
                          {d.title && d.description ? ' — ' : ''}
                          {d.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card title="Contact Information" icon={Mail}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Mail size={12} className="text-gray-400" />
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Email</span>
                </div>
                <p className="text-sm font-semibold text-gray-800 break-all">{t.email ?? '—'}</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Phone size={12} className="text-gray-400" />
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Phone</span>
                </div>
                <p className="text-sm font-semibold text-gray-800">
                  {t.phone?.code && t.phone?.digits ? `${t.phone.code} ${t.phone.digits}` : '—'}
                </p>
              </div>
            </div>
          </Card>

        </div>

        <div className="space-y-4 xl:sticky xl:top-6">

          <Card title="Documents" icon={FileText}>
            {hasDocs ? (
              <div className="space-y-2">
                {order.previewUrl && (
                  <DocLink icon={ImageIcon} label="Watermarked Preview" href={order.previewUrl} />
                )}
                {order.cleanPdfUrl && (
                  <DocLink icon={FileDown} label="Clean PDF (final)" href={order.cleanPdfUrl} />
                )}
                {supportingDocs.map((doc, i) => (
                  <DocLink
                    key={i}
                    icon={Paperclip}
                    label={doc.name || `Supporting document ${i + 1}`}
                    href={doc.url}
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-3">No documents yet.</p>
            )}
          </Card>

          <Card title="Payment" icon={CreditCard}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <Badge status={order.paymentStatus} cfgMap={PAYMENT_CFG} />
              </div>
              <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                <span className="text-sm text-gray-500">Amount</span>
                <span className="text-sm font-bold text-gray-900">{amount}</span>
              </div>
              {order.paidAt && (
                <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                  <span className="text-sm text-gray-500">Paid</span>
                  <span className="text-sm font-semibold text-gray-700">{convertToDubaiDate(order.paidAt)}</span>
                </div>
              )}
              {order.transactionId && (
                <div className="flex items-start justify-between border-t border-gray-50 pt-3 gap-2">
                  <span className="text-sm text-gray-500 shrink-0">Transaction</span>
                  <span className="text-[11px] font-mono text-gray-600 break-all text-right">{order.transactionId}</span>
                </div>
              )}
            </div>
          </Card>

          <Card title="Record" icon={Hash}>
            <InfoRow label="Status" value={order.status} />
            <InfoRow label="Created" value={`${convertToDubaiDate(order.createdAt)} ${convertToDubaiTime(order.createdAt)}`} />
            <InfoRow label="Updated" value={`${convertToDubaiDate(order.updatedAt)} ${convertToDubaiTime(order.updatedAt)}`} />
            <InfoRow label="Regenerations" value={order.regenCount} />
            <InfoRow label="AI edits" value={order.chatCount} />
            <InfoRow label="Post-pay edits" value={order.editCount} />
            <InfoRow label="Session" value={order.sessionId} mono />
          </Card>

          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Danger Zone</p>
            </div>
            <div className="p-5">
              <DeleteSection
                sessionId={order.sessionId}
                disabled={!isAdmin || order.paymentStatus === 'PAID'}
                disabledReason={
                  !isAdmin
                    ? 'Only admins can delete itineraries.'
                    : 'Paid itineraries cannot be deleted.'
                }
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
