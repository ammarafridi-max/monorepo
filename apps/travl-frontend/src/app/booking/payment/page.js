"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Ticket,
  CreditCard,
  Users,
  Mail,
  AlertCircle,
  Loader2,
  CalendarDays,
} from "lucide-react";
import { LuShieldPlus } from "react-icons/lu";
import { useCurrency } from "@travel-suite/frontend-shared/contexts/CurrencyContext";
import { useGetDummyTicket } from "@travel-suite/frontend-shared/hooks/dummy-tickets/useGetDummyTicket";
import { trackPurchaseEvent } from "@/lib/analytics";
import { useDummyTicketPricing } from "@travel-suite/frontend-shared/hooks/pricing/useDummyTicketPricing";
import { formatAmount } from "@travel-suite/frontend-shared/utils/currency";
import { formatDate } from "@travel-suite/frontend-shared/utils/dates";
import { getTicketPriceByValidity } from "@travel-suite/frontend-shared/utils/dummyTicketPricing";

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-gray-50">
      <span className="text-xs text-gray-400 shrink-0">{label}</span>
      <span className="text-sm font-semibold text-gray-800 text-right">
        {value ?? "—"}
      </span>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 size={28} className="animate-spin text-gray-300" />
    </div>
  );
}

function ErrorState() {
  return (
    <div className="max-w-lg mx-auto px-6 py-24 flex flex-col items-center text-center gap-5">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
        <AlertCircle size={28} className="text-red-400" />
      </div>
      <div>
        <p className="text-lg font-bold text-gray-900">Payment not found</p>
        <p className="text-sm text-gray-400 mt-1 max-w-sm">
          We couldn&apos;t find a successful payment linked to this booking. If
          you were charged, please contact our support team with your
          transaction details.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="text-sm font-bold px-5 py-2.5 bg-primary-700 hover:bg-primary-800 text-white rounded-xl transition-colors"
        >
          Back to home
        </Link>
        <a
          href="mailto:info@travl.ae"
          className="text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
        >
          Contact support
        </a>
      </div>
    </div>
  );
}

function SuccessContent({ sessionId, dummyTicket }) {
  const { pricing } = useDummyTicketPricing();
  const { formatMoney } = useCurrency();

  const type = dummyTicket?.type;
  const ticketValidity = dummyTicket?.ticketValidity;
  const currency = dummyTicket?.amountPaid?.currency;
  const amount = Number(dummyTicket?.amountPaid?.amount || 0);
  const isImmediate = dummyTicket?.ticketDelivery?.immediate;
  const deliveryDate = dummyTicket?.ticketDelivery?.deliveryDate;
  const hasReturn = type === "Return" && !!dummyTicket?.returnDate;
  const phone =
    dummyTicket?.phoneNumber?.code && dummyTicket?.phoneNumber?.digits
      ? `${dummyTicket.phoneNumber.code} ${dummyTicket.phoneNumber.digits}`
      : null;

  const adultsCount = Number(dummyTicket?.quantity?.adults || 0);
  const childrenCount = Number(dummyTicket?.quantity?.children || 0);
  const infantsCount = Number(dummyTicket?.quantity?.infants || 0);
  const totalPassengers = adultsCount + childrenCount;

  const travellersLabel = [
    adultsCount > 0 && `${adultsCount} Adult${adultsCount > 1 ? "s" : ""}`,
    childrenCount > 0 &&
      `${childrenCount} Child${childrenCount > 1 ? "ren" : ""}`,
    infantsCount > 0 &&
      `${infantsCount} Infant${infantsCount > 1 ? "s" : ""}`,
  ]
    .filter(Boolean)
    .join(", ");

  const fallbackPrice = getTicketPriceByValidity(pricing, ticketValidity);
  const price =
    totalPassengers > 0 && Number.isFinite(amount)
      ? amount / totalPassengers
      : fallbackPrice;

  const baseAmount = getTicketPriceByValidity(pricing, "2 Days");
  const displayAmount = formatMoney(baseAmount, "AED");

  useEffect(() => {
    if (!currency || !Number.isFinite(amount) || amount <= 0) return;
    trackPurchaseEvent({
      currency,
      value: amount,
      sessionId,
      transactionId: `dummy-ticket:${sessionId}`,
      dedupeKey: `dummy-ticket:${sessionId}`,
      items: [
        {
          item_name: `${type} Flight Reservation`,
          quantity: totalPassengers,
          price,
        },
      ],
    });
  }, [amount, currency, price, totalPassengers, sessionId, type]);

  useEffect(() => {
    localStorage.removeItem("SESSION_ID");
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex flex-col items-center text-center mb-10">
        <div className="relative mb-5">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 size={40} className="text-green-600" strokeWidth={1.5} />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border-2 border-white flex items-center justify-center">
            <Ticket size={14} className="text-primary-700" />
          </div>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
          Booking Confirmed!
        </h1>
        <p className="text-sm text-gray-500 max-w-md">
          Your payment of{" "}
          <span className="font-semibold text-gray-700">
            {currency} {formatAmount(amount)}
          </span>{" "}
          has been successfully processed. Your ticket will be sent to your
          email{!isImmediate && deliveryDate ? (
            <>
              {" "}on{" "}
              <span className="font-semibold text-gray-700">
                {formatDate(deliveryDate)}
              </span>
            </>
          ) : null}.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
        <div className="space-y-5">
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100">
              <Ticket size={14} className="text-gray-400" />
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Booking Details
              </p>
            </div>
            <div className="p-5">
              {/* 1. Trip type + Travelers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                <DetailRow label="Trip Type" value={type} />
                <DetailRow label="Travellers" value={travellersLabel || "—"} />
              </div>

              {/* 2. Ticket validity + Delivery */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                <DetailRow label="Ticket Validity" value={ticketValidity} />
                <DetailRow
                  label="Delivery"
                  value={isImmediate ? "Immediate" : `Scheduled — ${deliveryDate ? formatDate(deliveryDate) : "—"}`}
                />
              </div>

              {/* 3. From + To */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                <DetailRow label="From" value={dummyTicket?.from || "—"} />
                <DetailRow label="To" value={dummyTicket?.to || "—"} />
              </div>

              {/* 4. Departure + Return — full row when one-way */}
              {hasReturn ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                  <DetailRow label="Departure Date" value={formatDate(dummyTicket?.departureDate)} />
                  <DetailRow label="Return Date" value={formatDate(dummyTicket?.returnDate)} />
                </div>
              ) : (
                <DetailRow label="Departure Date" value={formatDate(dummyTicket?.departureDate)} />
              )}

              {/* 5. Email + Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                <DetailRow label="Email" value={dummyTicket?.email || "—"} />
                <DetailRow label="Phone" value={phone || "—"} />
              </div>

              {/* 6. Message — full row */}
              {dummyTicket?.message && (
                <DetailRow label="Message" value={dummyTicket.message} />
              )}
            </div>
          </div>

          {dummyTicket?.passengers?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100">
                <Users size={14} className="text-gray-400" />
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Passengers
                </p>
              </div>
              <div className="divide-y divide-gray-50">
                {dummyTicket.passengers.map((p, i) => (
                  <div key={i} className="px-5 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary-700">{i + 1}</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800">
                        {[p.title, p.firstName, p.lastName].filter(Boolean).join(" ") || "—"}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{p.type ?? "—"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100">
              <CreditCard size={14} className="text-gray-400" />
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Payment
              </p>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <DetailRow label="Status" value="Paid" />
              <DetailRow
                label="Amount Paid"
                value={
                  amount > 0 ? `${currency} ${formatAmount(amount)}` : "—"
                }
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:sticky lg:top-6">
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
                    {isImmediate
                      ? "A receipt and your flight reservation will arrive in two separate emails shortly."
                      : `Your flight reservation will be emailed to you on ${deliveryDate ? formatDate(deliveryDate) : "the scheduled date"}.`}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                  <CalendarDays size={13} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-700">
                    Check your spam folder
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    If you don&apos;t see the email, check your spam or junk
                    folder just in case.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 flex items-center justify-center bg-primary-50 text-primary-700 rounded-full">
                <LuShieldPlus size={15} />
              </div>
              <p className="text-sm font-bold text-gray-700">
                Add Travel Insurance?
              </p>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              Get a genuine travel insurance policy accepted by embassies for
              visa applications. Exclusively for UAE residents.
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gray-400">from</p>
                <p className="text-sm font-bold text-gray-800">
                  {displayAmount.code} {displayAmount.value}
                </p>
              </div>
              <Link
                href="/travel-insurance"
                className="text-xs font-bold px-3 py-1.5 bg-primary-700 hover:bg-primary-800 text-white rounded-lg transition-colors"
              >
                Book Now
              </Link>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center">
            <p className="text-xs text-gray-500 mb-2">
              Need help with your booking?
            </p>
            <a
              href="mailto:info@travl.ae"
              className="text-xs font-bold text-primary-700 hover:text-primary-900 transition-colors"
            >
              Contact our support team →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId") || "";
  const { dummyTicket, isLoadingDummyTicket, isErrorDummyTicket } =
    useGetDummyTicket(sessionId);

  if (isLoadingDummyTicket) return <LoadingState />;

  if (
    isErrorDummyTicket ||
    dummyTicket?.paymentStatus === "UNPAID" ||
    !sessionId
  )
    return <ErrorState />;

  return <SuccessContent sessionId={sessionId} dummyTicket={dummyTicket} />;
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 size={28} className="animate-spin text-gray-300" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
