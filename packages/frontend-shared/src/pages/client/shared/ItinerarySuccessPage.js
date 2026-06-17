'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, CheckCircle, Download, Pencil } from 'lucide-react';
import { useItineraryOrder } from '../../../hooks/itineraries/useItineraryOrder';
import { itineraryDocumentUrl } from '../../../services/apiItineraries';
import { trackItineraryPurchase } from '../../../utils/analytics';

export default function ItinerarySuccessPage({ sessionId }) {
  const [slow, setSlow] = useState(false);

  // Poll while the Stripe webhook settles; stop once paid.
  const { order, refetchOrder } = useItineraryOrder(sessionId, {
    refetchInterval: (query) => (query.state.data?.paymentStatus === 'PAID' ? false : 2500),
  });

  const isPaid = order?.paymentStatus === 'PAID';

  useEffect(() => {
    if (isPaid) return undefined;
    const t = setTimeout(() => setSlow(true), 30_000);
    return () => clearTimeout(t);
  }, [isPaid]);

  // GA4 purchase — fires once when payment is confirmed (deduped by sessionId).
  useEffect(() => {
    if (isPaid && order) {
      trackItineraryPurchase({ sessionId, value: order.price, currency: order.currency });
    }
  }, [isPaid, order, sessionId]);

  if (!isPaid) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 flex flex-col items-center gap-4 text-center">
        <Loader2 size={32} className="animate-spin text-primary-500" />
        <h1 className="text-lg font-bold text-gray-900">Confirming your payment…</h1>
        <p className="text-sm text-gray-500">This usually only takes a few seconds.</p>
        {slow && (
          <div className="mt-2 flex flex-col items-center gap-2">
            <p className="text-xs text-gray-400 max-w-sm">
              Still processing. If you completed payment, it can take a moment to confirm.
            </p>
            <button
              onClick={() => refetchOrder()}
              className="text-sm font-semibold text-primary-700 hover:underline"
            >
              Check again
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-20 flex flex-col items-center gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
        <CheckCircle className="text-primary-600" size={32} />
      </div>
      <h1 className="text-2xl font-bold text-gray-900">Your itinerary is ready</h1>
      <p className="text-sm text-gray-500 max-w-sm">
        Payment received. Download your clean, print-ready PDF below — ready to submit with your visa application.
      </p>

      <a
        href={itineraryDocumentUrl(sessionId)}
        className="mt-2 flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-800 text-white font-semibold text-sm px-6 py-3.5 rounded-xl transition-colors"
      >
        <Download size={16} /> Download PDF
      </a>

      {order?.canEditFree && (
        <Link
          href={`/itinerary-booking/${sessionId}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 hover:underline mt-1"
        >
          <Pencil size={13} /> Need a change? You have free edits for {order.postPaymentEditLimit} revisions.
        </Link>
      )}

      <p className="text-xs text-gray-400 mt-4">
        A copy of your document is linked to this page. Keep it bookmarked to download again.
      </p>
    </div>
  );
}
