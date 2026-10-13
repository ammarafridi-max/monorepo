'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Lock, Loader2, ArrowLeft, Mail, User, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useHotelBooking } from '../../hooks/hotel-bookings/useHotelBooking';
import { useHotelStripePaymentURL } from '../../hooks/hotel-bookings/useHotelStripePaymentURL';
import { useHotelPricing, getHotelPrice } from '../../hooks/hotel-bookings/useHotelPricing';
import { formatAmount } from '../../utils/currency';
import { getMetaBrowserIds, pixelInitiateCheckout } from '../../utils/pixel';
import { formatDate } from '../../utils/dates';
import PageLoader from '../../components/ui/v1/PageLoader';

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

export default function HotelReviewDetailsPage({ onBeginCheckout, searchPath = '/hotel-booking' }) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState(null);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    setSessionId(localStorage.getItem('HOTEL_SESSION_ID') || '');
  }, []);

  const { selectedCurrency, formatMoney } = useCurrency();
  const { pricing } = useHotelPricing(selectedCurrency?.code);
  const { reservation, isLoadingReservation, isErrorReservation } = useHotelBooking(sessionId);
  const { createHotelStripePayment, isLoadingHotelPaymentURL, isErrorHotelPaymentURL } = useHotelStripePaymentURL();

  const nights = reservation?.nights ?? 1;
  const basePrice = getHotelPrice(pricing, nights);
  const totalAmount = formatMoney(basePrice, pricing?.currency).amount;
  const currencyCode = selectedCurrency?.code || 'AED';

  useEffect(() => {
    if (sessionId === '') router.replace(searchPath);
  }, [sessionId, router, searchPath]);

  useEffect(() => {
    if (isErrorHotelPaymentURL) {
      toast.error('Could not get payment URL. Please send us an email.');
    }
  }, [isErrorHotelPaymentURL]);

  function handleConfirm() {
    if (!agreed || isLoadingHotelPaymentURL || !sessionId) return;
    onBeginCheckout?.({
      currency: currencyCode,
      value: totalAmount,
      items: [{ item_name: 'Hotel reservation', price: totalAmount, quantity: 1 }],
    });
    pixelInitiateCheckout({ currency: currencyCode, value: totalAmount, numItems: 1 });
    createHotelStripePayment({ sessionId, currencyCode, ...getMetaBrowserIds() });
  }

  if (sessionId === null || sessionId === '' || isLoadingReservation) return <PageLoader />;

  if (isErrorReservation || !reservation) {
    return (
      <div className="max-w-lg mx-auto py-24 flex flex-col items-center text-center gap-5">
        <div>
          <p className="text-lg font-bold text-gray-900">This reservation is no longer available</p>
          <p className="text-sm text-gray-500 mt-1">
            Your details could not be loaded. Start a new search and it takes about a minute.
          </p>
        </div>
        <Link
          href={searchPath}
          className="text-sm font-bold px-5 py-2.5 bg-primary-700 hover:bg-primary-800 text-white rounded-xl transition-colors"
        >
          Start a new search
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900">Review Your Reservation</h1>
        <p className="text-sm text-gray-500 mt-1.5">
          Please check all details carefully before proceeding to payment.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="flex flex-col gap-5">
          <SectionCard title="Stay Details" editHref="/hotel-booking/select-room">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <Row label="Hotel" value={reservation.hotel?.name} />
              <Row label="City" value={reservation.hotel?.city ?? reservation.destination?.cityName} />
              <Row label="Check-in" value={formatDate(reservation.checkIn)} />
              <Row label="Check-out" value={formatDate(reservation.checkOut)} />
              <Row label="Nights" value={reservation.nights} />
              <Row label="Rooms" value={reservation.occupancy?.rooms} />
              <Row label="Adults" value={reservation.occupancy?.adults} />
              <Row label="Guest nationality" value={reservation.guestNationality} />
            </div>
          </SectionCard>

          <SectionCard title="Contact Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <Row label="Email" value={reservation.email} />
              <Row
                label="Phone"
                value={`${reservation.phoneNumber?.code || ''}${reservation.phoneNumber?.digits || ''}`}
              />
            </div>
          </SectionCard>

          {reservation.guests?.length > 0 && (
            <SectionCard title="Guests">
              {reservation.guests.map((g, i) => (
                <div key={i} className={i > 0 ? 'pt-4 mt-4 border-t border-gray-100' : ''}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                      <User size={12} className="text-primary-700" />
                    </div>
                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Room {i + 1}{g.isLead ? ' (lead)' : ''}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                    <Row
                      label="Full Name"
                      value={[g.title, g.firstName, g.lastName].filter(Boolean).join(' ')}
                    />
                  </div>
                </div>
              ))}
            </SectionCard>
          )}
        </div>

        <div className="lg:sticky lg:top-6 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Order Summary</p>
            </div>
            <div className="px-5 py-4 flex flex-col gap-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Reservation</span>
                <span className="font-medium text-gray-900">
                  {currencyCode} {formatAmount(totalAmount)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Nights</span>
                <span className="font-normal text-gray-900">{nights}</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between items-baseline">
                <span className="text-sm font-semibold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-gray-900">
                  {currencyCode} {formatAmount(totalAmount)}
                </span>
              </div>
            </div>
            {reservation.email && (
              <div className="px-5 py-3 bg-primary-50 border-t border-primary-100">
                <p className="text-xs text-primary-700">
                  <Mail size={11} className="inline mr-1" />
                  Confirmation will be sent to <span className="font-semibold">{reservation.email}</span>
                </p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4">
            <div className="flex items-start gap-2 rounded-xl bg-green-50 border border-green-100 p-3">
              <ShieldCheck size={14} className="text-green-700 shrink-0 mt-0.5" />
              <p className="text-xs text-green-800 leading-relaxed">
                We book a real refundable room in your name. The confirmation is genuine and verifiable.
              </p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="sr-only peer"
              />
              <div
                aria-hidden="true"
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 ${
                  agreed ? 'bg-primary-700 border-primary-700' : 'border-gray-300 hover:border-primary-400'
                }`}
              >
                {agreed && <Check size={11} strokeWidth={3} className="text-white" />}
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                I confirm all details above are correct and I agree to the{' '}
                <Link href="/terms-and-conditions" className="text-primary-700 hover:underline font-semibold">
                  Terms &amp; Conditions
                </Link>{' '}
                and{' '}
                <Link href="/privacy-policy" className="text-primary-700 hover:underline font-semibold">
                  Privacy Policy
                </Link>
                .
              </p>
            </label>

            <button
              onClick={handleConfirm}
              disabled={!agreed || isLoadingHotelPaymentURL}
              className="cursor-pointer w-full inline-flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold py-3.5 rounded-xl transition-colors bg-accent-500 hover:bg-accent-600"
            >
              {isLoadingHotelPaymentURL ? (
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
              href="/hotel-booking/select-room"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft size={13} /> Back to rooms
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
