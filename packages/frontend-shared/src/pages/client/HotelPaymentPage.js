'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2, BedDouble, CreditCard, Users, Mail, AlertCircle, Loader2, CalendarDays, ShieldCheck,
} from 'lucide-react';
import { useHotelBooking } from '../../hooks/hotel-bookings/useHotelBooking';
import { formatAmount } from '../../utils/currency';
import { pixelPurchase } from '../../utils/pixel';
import { formatDate } from '../../utils/dates';

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-gray-50">
      <span className="text-xs text-gray-400 shrink-0">{label}</span>
      <span className="text-sm font-semibold text-gray-800 text-right">{value ?? '—'}</span>
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

function ConfirmingState({ title, body }) {
  return (
    <div className="max-w-lg mx-auto px-6 py-24 flex flex-col items-center text-center gap-5">
      <Loader2 size={28} className="animate-spin text-primary-600" />
      <div>
        <p className="text-lg font-bold text-gray-900">{title}</p>
        <p className="text-sm text-gray-400 mt-1 max-w-sm">{body}</p>
      </div>
    </div>
  );
}

function ErrorState({ supportEmail, sessionId }) {
  return (
    <div className="max-w-lg mx-auto px-6 py-24 flex flex-col items-center text-center gap-5">
      <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
        <AlertCircle size={26} className="text-red-400" />
      </div>
      <div>
        <p className="text-lg font-bold text-gray-900">We could not load your reservation</p>
        <p className="text-sm text-gray-500 mt-1">
          Your payment may still have gone through. Email us at{' '}
          <a href={`mailto:${supportEmail}`} className="font-semibold text-primary-700 hover:underline">
            {supportEmail}
          </a>{' '}
          quoting reference <span className="font-mono text-xs">{sessionId}</span> and we will sort it out.
        </p>
      </div>
      <Link
        href="/"
        className="text-sm font-bold px-5 py-2.5 bg-primary-700 hover:bg-primary-800 text-white rounded-xl transition-colors"
      >
        Back to home
      </Link>
    </div>
  );
}

function PaymentContent({ onPurchaseEvent, supportEmail }) {
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    setSessionId(localStorage.getItem('HOTEL_SESSION_ID') || '');
  }, []);

  // The supplier booking runs off the Stripe webhook, so the reservation lands
  // PAID before it lands BOOKED. Poll until the hotel confirmation exists.
  const { reservation, isLoadingReservation, isErrorReservation } = useHotelBooking(sessionId, {
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 2000;
      if (data.paymentStatus !== 'PAID') return 2000;
      if (data.orderStatus === 'PENDING') return 2000;
      return false;
    },
  });

  const amount = reservation?.amountPaid?.amount;
  const currency = reservation?.amountPaid?.currency;

  useEffect(() => {
    if (!currency || !Number.isFinite(amount) || amount <= 0) return;
    onPurchaseEvent?.({
      currency,
      value: amount,
      sessionId,
      transactionId: `hotel-booking:${sessionId}`,
      dedupeKey: `hotel-booking:${sessionId}`,
      items: [{ item_name: 'Hotel Reservation', quantity: 1, price: amount }],
    });
    pixelPurchase({ currency, value: amount, eventId: `hotel-booking:${sessionId}` });
  }, [amount, currency, sessionId, onPurchaseEvent]);

  useEffect(() => {
    if (reservation?.orderStatus === 'BOOKED' || reservation?.orderStatus === 'DELIVERED') {
      localStorage.removeItem('HOTEL_SESSION_ID');
    }
  }, [reservation?.orderStatus]);

  if (sessionId === null || isLoadingReservation) return <LoadingState />;
  if (!sessionId || isErrorReservation || !reservation) {
    return <ErrorState supportEmail={supportEmail} sessionId={sessionId} />;
  }

  if (reservation.paymentStatus !== 'PAID') {
    return (
      <ConfirmingState
        title="Confirming your payment"
        body="Stripe is sending us the confirmation. This usually takes a few seconds. Please keep this page open."
      />
    );
  }

  if (reservation.orderStatus === 'PENDING') {
    return (
      <ConfirmingState
        title="Booking your room"
        body="We are placing a real refundable booking with the hotel. This usually takes a few seconds. Please keep this page open."
      />
    );
  }

  if (reservation.orderStatus === 'BOOKING_FAILED') {
    return (
      <div className="max-w-lg mx-auto px-6 py-24 flex flex-col items-center text-center gap-5">
        <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
          <AlertCircle size={26} className="text-amber-500" />
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900">Your payment went through</p>
          <p className="text-sm text-gray-500 mt-1">
            The room did not confirm automatically, so our team is finishing it by hand. You will get your
            confirmation by email shortly. Reference <span className="font-mono text-xs">{reservation.sessionId}</span>.
          </p>
        </div>
      </div>
    );
  }

  const guestsLabel = `${reservation.occupancy?.rooms ?? 1} Room${(reservation.occupancy?.rooms ?? 1) > 1 ? 's' : ''}, ${reservation.occupancy?.adults ?? 1} Adult${(reservation.occupancy?.adults ?? 1) > 1 ? 's' : ''}`;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex flex-col items-center text-center mb-10">
        <div className="relative mb-5">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 size={40} className="text-green-600" strokeWidth={1.5} />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border-2 border-white flex items-center justify-center">
            <BedDouble size={14} className="text-primary-700" />
          </div>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Reservation Confirmed!</h1>
        <p className="text-sm text-gray-500 max-w-md">
          Your payment of{' '}
          <span className="font-semibold text-gray-700">
            {currency} {formatAmount(amount)}
          </span>{' '}
          has been processed and your room is booked. The confirmation is on its way to your email.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 items-start">
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm divide-y divide-gray-100">
          <section>
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100">
              <BedDouble size={14} className="text-gray-400" />
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Reservation Details</p>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                <DetailRow label="Hotel" value={reservation.hotel?.name} />
                <DetailRow label="City" value={reservation.hotel?.city ?? reservation.destination?.cityName} />
                <DetailRow label="Check-in" value={formatDate(reservation.checkIn)} />
                <DetailRow label="Check-out" value={formatDate(reservation.checkOut)} />
                <DetailRow label="Nights" value={reservation.nights} />
                <DetailRow label="Guests" value={guestsLabel} />
                <DetailRow label="Confirmation" value={reservation.supplier?.hotelConfirmationCode} />
                <DetailRow label="Booking reference" value={reservation.supplier?.bookingId} />
              </div>
            </div>
          </section>

          {reservation.guests?.length > 0 && (
            <section>
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100">
                <Users size={14} className="text-gray-400" />
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Guests</p>
              </div>
              <div className="p-5 flex flex-col gap-1">
                {reservation.guests.map((g, i) => (
                  <p key={i} className="text-sm text-gray-800">
                    {[g.title, g.firstName, g.lastName].filter(Boolean).join(' ')}
                    {g.isLead && <span className="text-xs text-gray-400 ml-2">Lead guest</span>}
                  </p>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100">
              <CreditCard size={14} className="text-gray-400" />
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Payment</p>
            </div>
            <div className="p-5">
              <DetailRow label="Amount paid" value={`${currency} ${formatAmount(amount)}`} />
              <DetailRow label="Reference" value={reservation.sessionId} />
            </div>
          </div>

          {reservation.freeCancellationUntil && (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4 flex items-start gap-2.5">
              <ShieldCheck size={15} className="text-green-700 shrink-0 mt-0.5" />
              <p className="text-xs text-green-800 leading-relaxed">
                This is a genuine refundable booking. It stays valid until{' '}
                <span className="font-semibold">{formatDate(reservation.freeCancellationUntil)}</span>.
              </p>
            </div>
          )}

          {reservation.email && (
            <div className="rounded-2xl border border-primary-100 bg-primary-50 p-4 flex items-start gap-2.5">
              <Mail size={15} className="text-primary-700 shrink-0 mt-0.5" />
              <p className="text-xs text-primary-800 leading-relaxed">
                Sent to <span className="font-semibold">{reservation.email}</span>
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-gray-200 bg-white p-4 flex items-start gap-2.5">
            <CalendarDays size={15} className="text-gray-400 shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500 leading-relaxed">
              Keep this reference for your visa file. Contact us any time at{' '}
              <a href={`mailto:${supportEmail}`} className="font-semibold text-primary-700 hover:underline">
                {supportEmail}
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HotelPaymentPage(props) {
  return (
    <Suspense fallback={<LoadingState />}>
      <PaymentContent {...props} />
    </Suspense>
  );
}
