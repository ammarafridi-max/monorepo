'use client';

import { useContext, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Check,
  Lock,
  Loader2,
  ArrowLeft,
  Mail,
  User,
  Pencil,
  Plane,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { TicketContext } from '@travel-suite/frontend-shared/contexts/TicketContext';
import { useCurrency } from '@travel-suite/frontend-shared/contexts/CurrencyContext';
import { useGetDummyTicket } from '@travel-suite/frontend-shared/hooks/dummy-tickets/useGetDummyTicket';
import { useStripePaymentURL } from '@travel-suite/frontend-shared/hooks/dummy-tickets/useStripePaymentURL';
import { useDummyTicketPricing } from '@travel-suite/frontend-shared/hooks/pricing/useDummyTicketPricing';
import { trackBeginCheckout } from '@/lib/analytics';
import { formatAmount } from '@travel-suite/frontend-shared/utils/currency';
import { formatDate } from '@travel-suite/frontend-shared/utils/dates';
import { getTicketPriceByValidity } from '@travel-suite/frontend-shared/utils/dummyTicketPricing';
import PageLoader from '@travel-suite/frontend-shared/components/v1/ui/PageLoader';

function SectionCard({ title, editHref, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {editHref && (
          <Link
            href={editHref}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary-700 hover:text-primary-900 transition-colors"
          >
            <Pencil size={12} strokeWidth={2.5} />
            Edit
          </Link>
        )}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 font-normal shrink-0">{label}</span>
      <span className="text-sm text-gray-900 font-normal text-right">{value || '—'}</span>
    </div>
  );
}

export default function Page() {
  const sessionId = typeof window === 'undefined' ? '' : localStorage.getItem('SESSION_ID');
  const { type } = useContext(TicketContext);
  const { selectedCurrency, formatMoney } = useCurrency();
  const { pricing } = useDummyTicketPricing();
  const { createStripePayment, isLoadingStripePaymentURL, isErrorStripePaymentURL } = useStripePaymentURL();
  const { dummyTicket, isLoadingDummyTicket } = useGetDummyTicket(sessionId);
  const [agreed, setAgreed] = useState(false);

  const totalQuantity =
    Number(dummyTicket?.quantity?.adults || 0) +
    Number(dummyTicket?.quantity?.children || 0);
  const baseTicketPrice = getTicketPriceByValidity(pricing, dummyTicket?.ticketValidity);
  const ticketPrice = formatMoney(baseTicketPrice, 'AED').amount;
  const totalAmount = ticketPrice * totalQuantity;
  const currencyCode = selectedCurrency?.code || 'AED';

  useEffect(() => {
    if (isErrorStripePaymentURL) {
      toast.error('Could not get payment URL. Please send us an email.');
    }
  }, [isErrorStripePaymentURL]);

  const handleConfirm = () => {
    if (!agreed || isLoadingStripePaymentURL || !sessionId) return;
    trackBeginCheckout({
      currency: currencyCode,
      value: totalAmount,
      items: [{ item_name: `${type} flight reservation`, price: ticketPrice, quantity: totalQuantity }],
    });
    createStripePayment({ ...dummyTicket, totalAmount, currencyCode });
  };

  if (isLoadingDummyTicket) return <PageLoader />;

  const depFlight = [
    dummyTicket?.flightDetails?.departureFlight?.segments?.[0]?.carrierCode,
    dummyTicket?.flightDetails?.departureFlight?.segments?.[0]?.flightNumber,
  ].filter(Boolean).join(' ') || '—';

  const retFlight = [
    dummyTicket?.flightDetails?.returnFlight?.segments?.[0]?.carrierCode,
    dummyTicket?.flightDetails?.returnFlight?.segments?.[0]?.flightNumber,
  ].filter(Boolean).join(' ') || null;

  const groupedPassengers = dummyTicket?.passengers?.reduce((acc, p) => {
    if (!acc[p.type]) acc[p.type] = [];
    acc[p.type].push(p);
    return acc;
  }, {}) || {};

  const typeLabel = (key) => key.charAt(0).toUpperCase() + key.slice(1);

  return (
    <div className="max-w-5xl mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900">Review Your Booking</h1>
        <p className="text-sm text-gray-500 mt-1.5">
          Please check all details carefully before proceeding to payment.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">

        {/* -- Main column -- */}
        <div className="flex flex-col gap-5">

          {/* Flight Details */}
          <SectionCard title="Flight Details" editHref="/booking/select-flights">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <Row label="Trip Type"        value={dummyTicket?.type} />
              <Row label="From"             value={dummyTicket?.from} />
              <Row label="To"               value={dummyTicket?.to} />
              <Row label="Departure Date"   value={formatDate(dummyTicket?.departureDate)} />
              <Row label="Departure Flight" value={depFlight} />
              {dummyTicket?.type === 'Return' && (
                <>
                  <Row label="Return Date"   value={formatDate(dummyTicket?.returnDate)} />
                  {retFlight && <Row label="Return Flight" value={retFlight} />}
                </>
              )}
            </div>
          </SectionCard>

          {/* Booking Details */}
          <SectionCard title="Booking Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <Row label="Email"          value={dummyTicket?.email} />
              <Row label="Phone"          value={`${dummyTicket?.phoneNumber?.code || ''}${dummyTicket?.phoneNumber?.digits || ''}`} />
              <Row label="Ticket Validity" value={dummyTicket?.ticketValidity} />
              <Row
                label="Delivery"
                value={dummyTicket?.ticketDelivery?.immediate ? 'Immediate' : formatDate(dummyTicket?.ticketDelivery?.deliveryDate)}
              />
              {dummyTicket?.message && <Row label="Message" value={dummyTicket.message} />}
            </div>
          </SectionCard>

          {/* Passengers */}
          {dummyTicket?.passengers?.length > 0 && (
            <SectionCard title="Passengers">
              {Object.entries(groupedPassengers).map(([key, list], groupIdx) =>
                list.map((p, i) => {
                  const isFirst = groupIdx === 0 && i === 0;
                  return (
                    <div key={`${key}-${i}`} className={!isFirst ? 'pt-4 mt-4 border-t border-gray-100' : ''}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                          <User size={12} className="text-primary-700" />
                        </div>
                        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                          {typeLabel(key)} {i + 1}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                        <Row
                          label="Full Name"
                          value={[p.title, p.firstName, p.lastName].filter(Boolean).join(' ')}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </SectionCard>
          )}
        </div>

        {/* -- Sidebar -- */}
        <div className="lg:sticky lg:top-6 flex flex-col gap-4">

          {/* Order Summary */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Order Summary</p>
            </div>
            <div className="px-5 py-4 flex flex-col gap-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Price per ticket</span>
                <span className="font-medium text-gray-900">{currencyCode} {formatAmount(ticketPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Passengers</span>
                <span className="font-normal text-gray-900">{totalQuantity}</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between items-baseline">
                <span className="text-sm font-semibold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-gray-900">
                  {currencyCode} {formatAmount(totalAmount)}
                </span>
              </div>
            </div>
            {dummyTicket?.email && (
              <div className="px-5 py-3 bg-primary-50 border-t border-primary-100">
                <p className="text-xs text-primary-700">
                  <Mail size={11} className="inline mr-1" />
                  Reservation sent to <span className="font-semibold">{dummyTicket.email}</span>
                </p>
              </div>
            )}
          </div>

          {/* T&C + Pay */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <div
                onClick={() => setAgreed((p) => !p)}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                  agreed ? 'bg-primary-700 border-primary-700' : 'border-gray-300 hover:border-primary-400'
                }`}
              >
                {agreed && <Check size={11} strokeWidth={3} className="text-white" />}
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                I confirm all details above are correct and I agree to the{' '}
                <Link href="/terms" className="text-primary-700 hover:underline font-semibold">
                  Terms & Conditions
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-primary-700 hover:underline font-semibold">
                  Privacy Policy
                </Link>
                .
              </p>
            </label>

            <button
              onClick={handleConfirm}
              disabled={!agreed || isLoadingStripePaymentURL}
              className="w-full inline-flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold py-3.5 rounded-xl transition-colors"
            >
              {isLoadingStripePaymentURL ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <Lock size={14} />
                  Pay {currencyCode} {formatAmount(totalAmount)}
                </>
              )}
            </button>

            <p className="text-center text-xs text-gray-400">Secured by 256-bit SSL encryption</p>
          </div>

          <div className="text-center">
            <Link
              href="/booking/select-flights"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft size={13} /> Back to flights
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
