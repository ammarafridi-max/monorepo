'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Paperclip, Send, X } from 'lucide-react';
import { useSendHotelReservation } from '../../hooks/hotel-bookings/useHotelBookingActions';

function buildBody({ firstName, hotelName, checkIn, checkOut, agentFirstName, label, website }) {
  return [
    `Hi ${firstName || 'there'},`,
    '',
    'Your hotel reservation is attached. Here are the details:',
    '',
    `Hotel: ${hotelName || '-'}`,
    `Check in: ${checkIn || '-'}`,
    `Check out: ${checkOut || '-'}`,
    '',
    'Keep this for your visa file, or print it and attach it to your application.',
    '',
    'If anything looks wrong, just reply to this email and we will fix it.',
    '',
    'Regards,',
    agentFirstName || label,
    website,
  ].filter((line) => line !== undefined).join('\n');
}

export default function SendHotelReservationModal({ open, onClose, booking, agentName, brand }) {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const { sendReservation, isSending } = useSendHotelReservation();

  const firstName = booking?.guests?.[0]?.firstName || '';
  const agentFirstName = (agentName || '').trim().split(/\s+/)[0] || '';
  const label = brand?.label || '';
  const website = brand?.website || '';

  const defaultBody = useMemo(
    () => buildBody({
      firstName,
      hotelName: booking?.hotel?.name,
      checkIn: booking?.checkIn,
      checkOut: booking?.checkOut,
      agentFirstName,
      label,
      website,
    }),
    [firstName, booking?.hotel?.name, booking?.checkIn, booking?.checkOut, agentFirstName, label, website],
  );

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    if (!open) return;
    setSubject(label ? `Your Hotel Reservation — ${label}` : 'Your Hotel Reservation');
    setBody(defaultBody);
    setFile(null);
  }, [open, defaultBody, label]);

  if (!open) return null;

  const canSend = Boolean(file) && subject.trim() && body.trim() && !isSending;

  function handleSend() {
    if (!canSend) return;
    sendReservation(
      { sessionId: booking.sessionId, subject, body, file },
      { onSuccess: onClose },
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">Send reservation</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition">
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-gray-500">
          Sending to <span className="font-semibold text-gray-700">{booking?.email}</span>
        </p>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Subject</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary-400"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Message</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary-400"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Reservation PDF</label>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-gray-300 text-sm text-gray-600 hover:border-primary-400 hover:text-primary-700 transition"
          >
            <Paperclip size={14} />
            {file ? file.name : 'Choose a PDF'}
          </button>
        </div>

        <button
          onClick={handleSend}
          disabled={!canSend}
          className="w-full inline-flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold py-3 rounded-xl transition-colors"
        >
          {isSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Send to customer
        </button>
      </div>
    </div>
  );
}
