'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, AlertCircle, Download, Trash2,
  User, Mail, Phone, MapPin, CreditCard, FileText,
  Calendar, Globe, Users, ShieldCheck, Hash,
} from 'lucide-react';
import { useGetInsuranceApplication }      from '@travel-suite/frontend-shared/hooks/insurance/useGetInsuranceApplication';
import { useUpdateInsuranceApplication }   from '@travel-suite/frontend-shared/hooks/insurance/useUpdateInsuranceApplication';
import { useDeleteInsuranceApplication }   from '@travel-suite/frontend-shared/hooks/insurance/useDeleteInsuranceApplication';
import { useGetInsuranceDocuments } from '@travel-suite/frontend-shared/hooks/insurance/useGetInsuranceDocuments';

/* --- Badges ----------------------------------------------------------------- */

const PAYMENT_CFG = {
  PAID:     { dot: 'bg-green-500',  cls: 'bg-green-50   text-green-700   border-green-200'  },
  UNPAID:   { dot: 'bg-amber-400',  cls: 'bg-amber-50   text-amber-700   border-amber-200'  },
  PENDING:  { dot: 'bg-blue-400',   cls: 'bg-blue-50    text-blue-700    border-blue-200'   },
  FAILED:   { dot: 'bg-red-500',    cls: 'bg-red-50     text-red-700     border-red-200'    },
  REFUNDED: { dot: 'bg-gray-400',   cls: 'bg-gray-100   text-gray-600    border-gray-200'   },
};

const JOURNEY_CFG = {
  single:   'bg-blue-50   text-blue-700   border-blue-200',
  annual:   'bg-purple-50 text-purple-700 border-purple-200',
  biennial: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

function PaymentBadge({ status }) {
  const cfg = PAYMENT_CFG[status] ?? { dot: 'bg-gray-400', cls: 'bg-gray-100 text-gray-500 border-gray-200' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.cls}`}>
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      {{ PAID: 'Paid', UNPAID: 'Unpaid', PENDING: 'Pending', FAILED: 'Failed', REFUNDED: 'Refunded' }[status] ?? status}
    </span>
  );
}

function JourneyBadge({ type }) {
  const cls = JOURNEY_CFG[type] ?? 'bg-gray-100 text-gray-500 border-gray-200';
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${cls}`}>
      {type ? type.charAt(0).toUpperCase() + type.slice(1) : '—'}
    </span>
  );
}

/* --- Helpers ---------------------------------------------------------------- */

function fmtDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDatetime(str) {
  if (!str) return '—';
  return new Date(str).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function fmtAmount(amountPaid) {
  if (!amountPaid?.amount) return '—';
  return `${amountPaid.currency ?? ''} ${Number(amountPaid.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`.trim();
}

function leadName(app) {
  if (app.leadPassenger) return app.leadPassenger;
  const p = app.passengers?.[0];
  if (!p) return '—';
  const name = [p.firstName, p.lastName].filter(Boolean).join(' - ');
  return [p.title, name].filter(Boolean).join(' ') || '—';
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

/* --- Passenger table -------------------------------------------------------- */

const TYPE_CFG = {
  adult:  'bg-blue-50  text-blue-700  border-blue-200',
  child:  'bg-green-50 text-green-700 border-green-200',
  senior: 'bg-orange-50 text-orange-700 border-orange-200',
};

function PassengersTable({ passengers }) {
  if (!passengers?.length) {
    return <p className="text-xs text-gray-400 text-center py-4">No passenger data.</p>;
  }
  return (
    <div className="overflow-x-auto -mx-5">
      <table className="w-full text-sm min-w-[600px]">
        <thead>
          <tr className="bg-gray-50/60">
            {['#', 'Type', 'Name', 'Date of Birth', 'Nationality', 'Passport'].map((h, i) => (
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
              <td className="px-5 py-2.5">
                {p.type && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${TYPE_CFG[p.type] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                    {p.type.charAt(0).toUpperCase() + p.type.slice(1)}
                  </span>
                )}
              </td>
              <td className="px-5 py-2.5 font-semibold text-gray-800">
                {[p.title, [p.firstName, p.lastName].filter(Boolean).join(' - ')].filter(Boolean).join(' ') || '—'}
              </td>
              <td className="px-5 py-2.5 text-gray-600">{p.dob ?? '—'}</td>
              <td className="px-5 py-2.5 text-gray-600">{p.nationality ?? '—'}</td>
              <td className="px-5 py-2.5 font-mono text-gray-500">{p.passport ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* --- Delete confirmation ---------------------------------------------------- */

function DeleteSection({ sessionId }) {
  const [confirm, setConfirm] = useState(false);
  const { deleteInsuranceApplication, isDeleting } = useDeleteInsuranceApplication();

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 rounded-xl transition"
      >
        <Trash2 size={13} /> Delete Application
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
      <p className="text-xs font-semibold text-red-700">
        This permanently deletes the application and all associated data. This cannot be undone.
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => deleteInsuranceApplication(sessionId)}
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

/* --- Page ------------------------------------------------------------------- */

export default function ApplicationDetailPage() {
  const { sessionId } = useParams();

  const { application, isLoadingApplication, isErrorApplication } = useGetInsuranceApplication(sessionId);
  const { updateInsuranceApplication, isUpdatingApplication }     = useUpdateInsuranceApplication();
  const { documents, isLoadingDocuments }                          = useGetInsuranceDocuments(application?.policyId);

  /* -- Loading ---------------------------------------------------- */
  if (isLoadingApplication) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 size={28} className="animate-spin" />
          <p className="text-sm font-medium">Loading application…</p>
        </div>
      </div>
    );
  }

  /* -- Error ------------------------------------------------------ */
  if (isErrorApplication || !application) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center max-w-xs">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
            <AlertCircle size={24} className="text-red-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-700">Application not found</p>
            <p className="text-xs text-gray-400 mt-1">This application may have been deleted.</p>
          </div>
          <Link href="/admin/insurance-applications" className="flex items-center gap-1.5 text-xs font-semibold text-primary-700 hover:underline">
            <ArrowLeft size={13} /> Back to applications
          </Link>
        </div>
      </div>
    );
  }

  const app = application;
  const totalPassengers = (app.quantity?.adults ?? 0) + (app.quantity?.children ?? 0) + (app.quantity?.seniors ?? 0);
  const paymentOptions = ['UNPAID', 'PENDING', 'PAID', 'FAILED', 'REFUNDED'];

  return (
    <div className="max-w-7xl mx-auto space-y-5">

      {/* -- Page header ----------------------------------------------- */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/insurance-applications"
            className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 transition"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-extrabold text-gray-900">{leadName(app)}</h2>
              <PaymentBadge status={app.paymentStatus} />
              <JourneyBadge type={app.journeyType} />
            </div>
            <p className="text-[11px] text-gray-400 font-mono mt-0.5">
              Session: {app.sessionId}
            </p>
          </div>
        </div>

        {/* Update status */}
        <div className="flex items-center gap-2">
          <select
            value={app.paymentStatus}
            onChange={(e) => updateInsuranceApplication({ sessionId: app.sessionId, paymentStatus: e.target.value })}
            disabled={isUpdatingApplication}
            className="px-3 py-2.5 text-xs font-semibold border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {paymentOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* -- Two-column body -------------------------------------------- */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-5 items-start">

        {/* Main column */}
        <div className="space-y-5">

          {/* Passengers */}
          <Card title="Passengers" icon={Users}>
            <PassengersTable passengers={app.passengers} />
          </Card>

          {/* Contact information */}
          <Card title="Contact Information" icon={Mail}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Mail size={12} className="text-gray-400" />
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Email</span>
                </div>
                <p className="text-sm font-semibold text-gray-800 break-all">{app.email}</p>
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Phone size={12} className="text-gray-400" />
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Mobile</span>
                </div>
                <p className="text-sm font-semibold text-gray-800">
                  {app.mobile?.code && app.mobile?.digits
                    ? `+${app.mobile.code} ${app.mobile.digits}`
                    : '—'}
                </p>
              </div>

              {(app.streetAddress || app.addressLine2 || app.city || app.country) && (
                <div className="sm:col-span-2 mt-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <MapPin size={12} className="text-gray-400" />
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Address</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {[app.streetAddress, app.addressLine2, app.city, app.country].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Policy information */}
          {(app.policyId || app.policyNumber || app.schemeId || app.quoteId || app.transactionId) && (
            <Card title="Policy Information" icon={FileText}>
              <InfoRow label="Policy Number"  value={app.policyNumber}  mono />
              <InfoRow label="Policy ID"      value={app.policyId}      mono />
              <InfoRow label="Scheme ID"      value={app.schemeId}      mono />
              <InfoRow label="Quote ID"       value={app.quoteId}       mono />
              <InfoRow label="Transaction ID" value={app.transactionId} mono />
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
                <PaymentBadge status={app.paymentStatus} />
              </div>
              <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                <span className="text-sm text-gray-500">Amount</span>
                <span className="text-sm font-bold text-gray-900">{fmtAmount(app.amountPaid)}</span>
              </div>
              {app.transactionId && (
                <div className="flex items-start justify-between border-t border-gray-50 pt-3 gap-2">
                  <span className="text-sm text-gray-500 shrink-0">Transaction</span>
                  <span className="text-[11px] font-mono text-gray-600 break-all text-right">{app.transactionId}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Documents */}
          {app.paymentStatus === 'PAID' && app.policyId && (
            <Card title="Documents" icon={Download}>
              <div className="flex flex-col gap-2">
                {isLoadingDocuments ? (
                  <div className="flex items-center justify-center py-3">
                    <Loader2 size={16} className="animate-spin text-gray-400" />
                  </div>
                ) : (
                  documents.length > 0 ? (
                    documents.map((doc, i) => (
                      <button
                        key={i}
                        onClick={() => window.open(doc.url, '_blank')}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-primary-50 hover:text-primary-700 border border-gray-200 hover:border-primary-200 rounded-xl transition"
                      >
                        <Download size={12} className="shrink-0" />
                        {doc.name}
                      </button>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 py-2">No policy documents are available yet.</p>
                  )
                )}
              </div>
            </Card>
          )}

          {/* Journey */}
          <Card title="Journey" icon={Globe}>
            <InfoRow label="Type"    value={app.journeyType ? app.journeyType.charAt(0).toUpperCase() + app.journeyType.slice(1) : '—'} />
            <InfoRow label="Region"  value={app.region?.name} />
            <InfoRow label="Start"   value={fmtDate(app.startDate)} />
            <InfoRow label="End"     value={fmtDate(app.endDate)} />
            <InfoRow label="Adults"  value={app.quantity?.adults  ?? 0} />
            <InfoRow label="Children" value={app.quantity?.children ?? 0} />
            <InfoRow label="Seniors" value={app.quantity?.seniors  ?? 0} />
            <InfoRow label="Total"   value={totalPassengers} />
          </Card>

          {/* Metadata */}
          <Card title="Record" icon={Hash}>
            <InfoRow label="Created"   value={fmtDatetime(app.createdAt)} />
            <InfoRow label="Updated"   value={fmtDatetime(app.updatedAt)} />
            <InfoRow label="Review email" value={app.reviewEmailSent ? 'Sent' : 'Not sent'} />
          </Card>

          {/* Danger zone */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Danger Zone</p>
            </div>
            <div className="p-5">
              <DeleteSection sessionId={app.sessionId} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
