'use client';

import { useEffect, useState, useContext } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import {
  CheckCircle2,
  ShieldCheck,
  Download,
  Mail,
  Globe,
  Users,
  Hash,
  Copy,
  Check,
  ArrowRight,
  Phone,
  AlertCircle,
  Loader2,
  FileText,
} from 'lucide-react';
import { InsuranceContext } from '../../../contexts/InsuranceContext.js';
import { confirmInsurancePaymentApi } from '../../../services/apiInsurance.js';
import { useGetInsuranceDocuments } from '../../../hooks/insurance/useGetInsuranceDocuments.js';
import { trackPurchaseEvent } from '../../../utils/analytics';
import { pixelPurchase } from '../../../utils/pixel';
import { calcDays } from '../../../utils/insuranceHelpers.js';

function fmtDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function fmtAmount(amountPaid) {
  if (!amountPaid?.amount) return '—';
  return `${amountPaid.currency ?? 'AED'} ${Number(
    amountPaid.amount,
  ).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (!value) return;
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-lg text-gray-400 hover:text-primary-700 hover:bg-primary-50 transition-colors"
      title="Copy"
    >
      {copied ? (
        <Check size={13} className="text-green-600" />
      ) : (
        <Copy size={13} />
      )}
    </button>
  );
}

function DetailRow({ label, value, mono, action }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 shrink-0">{label}</span>
      <div className="flex items-center gap-1.5">
        <span
          className={`text-sm font-semibold text-gray-800 text-right ${mono ? 'font-mono text-xs' : ''}`}
        >
          {value ?? '—'}
        </span>
        {action}
      </div>
    </div>
  );
}

function ConfirmingState() {
  return (
    <div className="max-w-lg mx-auto px-6 py-24 flex flex-col items-center text-center gap-5">
      <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-primary-600" />
      </div>
      <div>
        <p className="text-lg font-bold text-gray-900">
          Confirming your policy…
        </p>
        <p className="text-sm text-gray-400 mt-1">
          Please wait while we confirm your payment and issue your policy.
        </p>
      </div>
    </div>
  );
}

function PendingConfirmationState({ onRetry }) {
  return (
    <div className="max-w-lg mx-auto px-6 py-24 flex flex-col items-center text-center gap-5">
      <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-blue-500" />
      </div>
      <div>
        <p className="text-lg font-bold text-gray-900">
          Payment received, policy still syncing
        </p>
        <p className="text-sm text-gray-400 mt-1 max-w-sm">
          WIS has redirected you back successfully, but your policy has not been
          issued yet. Please retry in a moment. If payment was collected, your
          documents will appear as soon as WIS confirms issuance.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 text-sm font-bold px-5 py-2.5 bg-primary-700 hover:bg-primary-800 text-white rounded-xl transition-colors"
        >
          Check again
        </button>
        <Link
          href="/contact"
          className="text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
        >
          Contact support
        </Link>
      </div>
    </div>
  );
}

function PaymentNotFoundState() {
  return (
    <div className="max-w-lg mx-auto px-6 py-24 flex flex-col items-center text-center gap-5">
      <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
        <AlertCircle size={28} className="text-amber-400" />
      </div>
      <div>
        <p className="text-lg font-bold text-gray-900">Payment not confirmed</p>
        <p className="text-sm text-gray-400 mt-1 max-w-sm">
          We couldn't find a completed payment for this session. If you believe
          this is a mistake, please contact our support team with your booking
          reference.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/travel-insurance"
          className="inline-flex items-center gap-2 text-sm font-bold px-5 py-2.5 bg-primary-700 hover:bg-primary-800 text-white rounded-xl transition-colors"
        >
          Back to home
        </Link>
        <Link
          href="/contact"
          className="text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
        >
          Contact support
        </Link>
      </div>
    </div>
  );
}

function BookingNotFoundState() {
  return (
    <div className="max-w-lg mx-auto px-6 py-24 flex flex-col items-center text-center gap-5">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
        <AlertCircle size={28} className="text-gray-400" />
      </div>
      <div>
        <p className="text-lg font-bold text-gray-900">Booking not found</p>
        <p className="text-sm text-gray-400 mt-1 max-w-sm">
          We couldn't find a booking matching this session. The link may be
          invalid or the session may have expired. Please contact support if you
          need help.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/travel-insurance"
          className="inline-flex items-center gap-2 text-sm font-bold px-5 py-2.5 bg-primary-700 hover:bg-primary-800 text-white rounded-xl transition-colors"
        >
          Back to home
        </Link>
        <Link
          href="/contact"
          className="text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
        >
          Contact support
        </Link>
      </div>
    </div>
  );
}

function ErrorState({ onRetry }) {
  return (
    <div className="max-w-lg mx-auto px-6 py-24 flex flex-col items-center text-center gap-5">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
        <AlertCircle size={28} className="text-red-400" />
      </div>
      <div>
        <p className="text-lg font-bold text-gray-900">Something went wrong</p>
        <p className="text-sm text-gray-400 mt-1 max-w-sm">
          We couldn't confirm your policy automatically. Don't worry — if your
          payment was successful, your policy will be issued shortly. Contact
          support if the issue persists.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 text-sm font-bold px-5 py-2.5 bg-primary-700 hover:bg-primary-800 text-white rounded-xl transition-colors"
        >
          Try again
        </button>
        <Link
          href="/contact"
          className="text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
        >
          Contact support
        </Link>
      </div>
    </div>
  );
}

export default function PaymentSuccess() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const paymentStatus = searchParams.get('paymentStatus');
  const paymentSyncToken = searchParams.get('paymentSyncToken');

  const [downloadingIdx, setDownloadingIdx] = useState(null);

  const {
    schemeId,
    journeyType,
    startDate,
    endDate,
    region,
    quantity,
    email,
    passengers,
  } = useContext(InsuranceContext);

  const {
    mutate: confirmPayment,
    data: confirmData,
    isPending,
    isSuccess,
    isError,
    error,
  } = useMutation({
    mutationFn: () =>
      confirmInsurancePaymentApi(sessionId, paymentSyncToken, paymentStatus),
    onSuccess: (data) => {
      if (data?.syncStatus !== 'ISSUED') return;
      const paid = data?.amountPaid;
      const amount = Number(paid?.amount) || 0;
      const currency = paid?.currency ?? 'AED';
      if (amount > 0) {
        trackPurchaseEvent({
          currency,
          value: amount,
          sessionId,
          transactionId: `insurance:${sessionId}`,
          dedupeKey: `insurance:${sessionId}`,
          items: [{ item_name: 'Travel Insurance Policy', quantity: 1, price: amount }],
        });
      }
      pixelPurchase({ currency, value: amount });
    },
  });

  const { documents, isLoadingDocuments } = useGetInsuranceDocuments(
    confirmData?.policyId,
  );

  async function handleDownload(doc, i) {
    setDownloadingIdx(i);
    try {
      const res = await fetch(doc.url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = doc.name || `document-${i + 1}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(doc.url, '_blank');
    } finally {
      setDownloadingIdx(null);
    }
  }

  useEffect(() => {
    if (sessionId && paymentSyncToken && paymentStatus === 'PAID') {
      confirmPayment();
    }
  }, [sessionId, paymentSyncToken, paymentStatus]);

  const app = confirmData ?? {};

  const resolvedJourneyType = app.journeyType ?? journeyType;
  const resolvedStartDate = app.startDate ?? startDate;
  const resolvedEndDate = app.endDate ?? endDate;
  const resolvedRegion = app.region ?? region;
  const resolvedEmail = app.email ?? email;
  const resolvedPassengers = app.passengers ?? passengers ?? [];
  const resolvedQuantity = app.quantity ?? quantity ?? {};

  const days = calcDays(
    resolvedJourneyType,
    resolvedStartDate,
    resolvedEndDate,
  );

  const syncStatus = confirmData?.syncStatus;

  const travellersLabel = [
    (resolvedQuantity.adults ?? 0) > 0 &&
      `${resolvedQuantity.adults} Adult${resolvedQuantity.adults > 1 ? 's' : ''}`,
    (resolvedQuantity.children ?? 0) > 0 &&
      `${resolvedQuantity.children} Child${resolvedQuantity.children > 1 ? 'ren' : ''}`,
    (resolvedQuantity.seniors ?? 0) > 0 &&
      `${resolvedQuantity.seniors} Senior${resolvedQuantity.seniors > 1 ? 's' : ''}`,
  ]
    .filter(Boolean)
    .join(', ');

  const JOURNEY_LABEL = {
    single: 'Single Trip',
    annual: 'Annual Multi-Trip',
    biennial: 'Biennial Multi-Trip',
  };

  if (
    !sessionId ||
    !paymentSyncToken ||
    (paymentStatus !== 'PAID' && !isPending && !isSuccess)
  ) {
    return <PaymentNotFoundState />;
  }
  if (isPending) return <ConfirmingState />;
  if (syncStatus === 'PENDING_CONFIRMATION') {
    return <PendingConfirmationState onRetry={confirmPayment} />;
  }
  if (syncStatus === 'FAILED') {
    return <PaymentNotFoundState />;
  }
  if (isError) {
    const msg = error?.message ?? '';
    if (msg.toLowerCase().includes('not found'))
      return <BookingNotFoundState />;
    if (
      msg.toLowerCase().includes('unable to confirm') ||
      msg.toLowerCase().includes('payment') ||
      msg.toLowerCase().includes('token')
    ) {
      return <PaymentNotFoundState />;
    }
    return <ErrorState onRetry={confirmPayment} />;
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex flex-col items-center text-center mb-10">
        <div className="relative mb-5">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2
              size={40}
              className="text-green-600"
              strokeWidth={1.5}
            />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border-2 border-white flex items-center justify-center">
            <ShieldCheck size={16} className="text-primary-700" />
          </div>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
          You&apos;re all covered!
        </h1>
        <p className="text-sm text-gray-500 max-w-md">
          Your policy has been issued and documents have been sent to{' '}
          <span className="font-semibold text-gray-700">
            {resolvedEmail || 'your email'}
          </span>
          .
        </p>

        {app.policyNumber && (
          <div className="mt-5 inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-2">
            <Hash size={13} className="text-green-600" />
            <span className="text-xs font-bold text-green-800 tracking-wide uppercase mr-1">
              Policy No.
            </span>
            <span className="text-sm font-mono font-bold text-green-900">
              {app.policyNumber}
            </span>
            <CopyButton value={app.policyNumber} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
        <div className="space-y-5">
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100">
              <Globe size={14} className="text-gray-400" />
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Trip Details
              </p>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <DetailRow
                label="Journey Type"
                value={
                  JOURNEY_LABEL[resolvedJourneyType] ?? resolvedJourneyType
                }
              />
              <DetailRow label="Region" value={resolvedRegion?.name} />
              {resolvedJourneyType !== 'single' ? (
                <DetailRow
                  label="Start Date"
                  value={fmtDate(resolvedStartDate)}
                />
              ) : (
                <>
                  <DetailRow
                    label="Departure"
                    value={fmtDate(resolvedStartDate)}
                  />
                  <DetailRow label="Return" value={fmtDate(resolvedEndDate)} />
                </>
              )}
              <DetailRow
                label="Duration"
                value={
                  resolvedJourneyType === 'annual'
                    ? 'Annual (365 days)'
                    : resolvedJourneyType === 'biennial'
                      ? 'Biennial (730 days)'
                      : `${days} days`
                }
              />
              <DetailRow label="Travellers" value={travellersLabel || '—'} />
              {fmtAmount(app.amountPaid) !== '—' && (
                <DetailRow
                  label="Total Paid"
                  value={fmtAmount(app.amountPaid)}
                />
              )}
            </div>
          </div>

          {resolvedPassengers.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100">
                <Users size={14} className="text-gray-400" />
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Insured Travellers
                </p>
              </div>
              <div className="divide-y divide-gray-50">
                {resolvedPassengers.map((p, i) => (
                  <div
                    key={i}
                    className="px-5 py-3 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary-700">
                          {i + 1}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {[p.title, p.firstName, p.lastName]
                            .filter(Boolean)
                            .join(' ') || '—'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {p.nationality?.nationality ?? p.nationality ?? '—'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">{p.dob ?? '—'}</p>
                      <p className="text-xs font-mono text-gray-500">
                        {p.passport ?? '—'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(app.policyId || app.policyNumber || app.transactionId) && (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100">
                <FileText size={14} className="text-gray-400" />
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Policy Reference
                </p>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                {app.policyNumber && (
                  <DetailRow
                    label="Policy Number"
                    value={app.policyNumber}
                    mono
                    action={<CopyButton value={app.policyNumber} />}
                  />
                )}
                {app.policyId && (
                  <DetailRow
                    label="Policy ID"
                    value={app.policyId}
                    mono
                    action={<CopyButton value={app.policyId} />}
                  />
                )}
                {app.transactionId && (
                  <DetailRow
                    label="Transaction ID"
                    value={app.transactionId}
                    mono
                    action={<CopyButton value={app.transactionId} />}
                  />
                )}
              </div>
            </div>
          )}

          {app.policyId && (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100">
                <Download size={14} className="text-gray-400" />
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Your Documents
                </p>
              </div>
              <div className="p-5">
                {isLoadingDocuments ? (
                  <div className="flex items-center gap-2.5 text-sm text-gray-400 py-2">
                    <Loader2 size={16} className="animate-spin shrink-0" />
                    Fetching your documents…
                  </div>
                ) : documents.length === 0 ? (
                  <p className="text-sm text-gray-400 py-1">
                    Documents are being prepared. Please check back shortly or
                    look in your inbox.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {documents.map((doc, i) => (
                      <button
                        key={i}
                        onClick={() => handleDownload(doc, i)}
                        disabled={downloadingIdx === i}
                        className="inline-flex items-center gap-3 px-4 py-3.5 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-xl transition-colors text-left disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {downloadingIdx === i ? (
                          <Loader2
                            size={18}
                            className="animate-spin text-primary-600 shrink-0"
                          />
                        ) : (
                          <Download
                            size={18}
                            className="text-primary-600 shrink-0"
                          />
                        )}
                        <div>
                          <p className="text-sm font-semibold text-primary-800 leading-tight">
                            {doc.name}
                          </p>
                          <p className="text-xs text-primary-500 mt-0.5">
                            {downloadingIdx === i
                              ? 'Downloading…'
                              : 'Click to download'}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4 lg:sticky lg:top-6">
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm p-5 flex flex-col gap-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
              Actions
            </p>
            <Link
              href="/travel-insurance"
              className="w-full inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold py-3 rounded-xl transition-colors"
            >
              Return to Home
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm p-5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">
              What&apos;s next
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                  <Mail size={13} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-700">
                    Check your inbox
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Your policy documents and certificate have been sent to your
                    email.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0 mt-0.5">
                  <Download size={13} className="text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-700">
                    Save your policy
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Download and save a copy of your policy documents before you
                    travel.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                  <Phone size={13} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-700">
                    Emergency line
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Your policy includes 24/7 emergency assistance. Keep the
                    number handy.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center">
            <p className="text-xs text-gray-500 mb-2">
              Need help with your policy?
            </p>
            <Link
              href="/contact"
              className="text-xs font-bold text-primary-700 hover:text-primary-900 transition-colors"
            >
              Contact our support team →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
