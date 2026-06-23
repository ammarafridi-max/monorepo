'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Loader2, Upload, FileText } from 'lucide-react';
import { useSendReservation } from '../../../hooks/dummy-tickets/useSendReservation';

const BRAND = process.env.NEXT_PUBLIC_BRAND;

// Brand-specific template strings. Keeping them in one place so the
// template author can see both variants side-by-side.
const BRANDS = {
  mdt: {
    label: 'MyDummyTicket',
    website: 'www.MyDummyTicket.ae',
    websiteUrl: 'https://www.MyDummyTicket.ae',
    trustpilotUrl: 'https://www.trustpilot.com/evaluate/mydummyticket.ae',
  },
  dt365: {
    label: 'Dummy Ticket 365',
    website: 'www.DummyTicket365.com',
    websiteUrl: 'https://www.DummyTicket365.com',
    trustpilotUrl: 'https://www.trustpilot.com/evaluate/dummyticket365.com',
  },
};

const brand = BRANDS[BRAND] || BRANDS.mdt;

function buildBody({ firstName, agentFirstName }) {
  return `Hi ${firstName || 'there'},

Thank you for choosing ${brand.label}. Please find your flight reservation attached to this email.

If you also need a travel itinerary, hotel booking or travel insurance, feel free to reach out to us anytime.

Additionally, when you purchase your actual flight ticket from us, we will refund the cost of your dummy ticket.

Finally, if you could take a moment and review your experience with us on our Trustpilot page, it would help us improve our services and travelers like you choose from the best providers.


Kind regards,
${agentFirstName || 'Team'}
${brand.website}`;
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Convert the edited plain-text body to HTML: escape user content,
// preserve blank lines, then upgrade two specific phrases to real
// anchor tags — "review your experience" → Trustpilot, the website
// line → brand homepage. If the agent edits those phrases away, the
// replacements become no-ops; the email still sends fine as plain
// text with line breaks.
function bodyToHtml(text) {
  const safe = escapeHtml(text);
  const withBreaks = safe.split('\n').map((l) => l || '&nbsp;').join('<br>');
  return withBreaks
    .replace(
      'review your experience',
      `<a href="${brand.trustpilotUrl}">review your experience</a>`,
    )
    .replace(
      brand.website,
      `<a href="${brand.websiteUrl}">${brand.website}</a>`,
    );
}

export default function SendReservationModal({ open, onClose, ticket, agentName }) {
  const firstName = ticket?.passengers?.[0]?.firstName || '';
  const agentFirstName = (agentName || '').trim().split(/\s+/)[0] || '';

  const defaultBody = useMemo(
    () => buildBody({ firstName, agentFirstName }),
    [firstName, agentFirstName],
  );

  const [subject, setSubject] = useState(`Your Flight Reservation — ${brand.label}`);
  const [body, setBody] = useState(defaultBody);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const { sendReservationAsync, isSending } = useSendReservation();

  // Re-seed when the modal opens with a different ticket (e.g. agent
  // navigates between tickets without unmounting the modal).
  useEffect(() => {
    if (open) {
      setSubject(`Your Flight Reservation — ${brand.label}`);
      setBody(defaultBody);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [open, defaultBody]);

  if (!open) return null;

  const customerEmail = ticket?.email || '';
  const canSubmit = !isSending && subject.trim() && body.trim() && file && customerEmail;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      await sendReservationAsync({
        sessionId: ticket.sessionId,
        subject: subject.trim(),
        body,
        bodyHtml: bodyToHtml(body),
        file,
      });
      onClose();
    } catch {
      // Toast handled in the hook.
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900">Send Reservation</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              To: <span className="font-semibold text-gray-600">{customerEmail || '(no email on file)'}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSending}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Body
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={14}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Reservation PDF
            </label>
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition">
                <Upload size={13} />
                {file ? 'Replace file' : 'Choose file'}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              {file && (
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                  <FileText size={12} /> {file.name} <span className="text-gray-300">({Math.round(file.size / 1024)} KB)</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">
              Max 10 MB. PDF only. Uploaded to Cloudinary and attached to the email.
            </p>
          </div>
        </form>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSending}
            className="px-3 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSending && <Loader2 size={12} className="animate-spin" />}
            Send Reservation
          </button>
        </div>
      </div>
    </div>
  );
}
