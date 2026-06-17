'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  RefreshCw,
  ShieldCheck,
  Lock,
  AlertCircle,
  AlertTriangle,
  Download,
  Send,
  Sparkles,
} from 'lucide-react';
import { useItineraryOrder } from '../../../hooks/itineraries/useItineraryOrder';
import { useRegenerateItinerary } from '../../../hooks/itineraries/useRegenerateItinerary';
import { useItineraryCheckout } from '../../../hooks/itineraries/useItineraryCheckout';
import { useItineraryChat } from '../../../hooks/itineraries/useItineraryChat';
import { itineraryPreviewUrl, itineraryDocumentUrl } from '../../../services/apiItineraries';
import { trackItineraryViewItem, trackItineraryBeginCheckout } from '../../../utils/analytics';

const EXAMPLE_PROMPTS = [
  'Add a relaxed day in Vienna',
  'Make day 2 more cultural',
  'Change my departure city to Milan',
  'Add an extra day to the trip',
];

function ChatPanel({ sessionId, chatsRemaining, mismatch }) {
  const { messages, sendMessage, isSending } = useItineraryChat(sessionId);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(null);
  const endRef = useRef(null);

  const exhausted = chatsRemaining <= 0;

  // When the main destination doesn't match the embassy, lead with two one-click
  // fixes — both run through the normal AI edit (and therefore re-validate).
  const mismatchSuggestions = mismatch?.hasMismatch
    ? [
        `Rebalance my trip so ${mismatch.applyingTo} is my main destination`,
        `Switch my application to ${mismatch.mainDestination} instead`,
      ]
    : [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pending, isSending]);

  function submit(text) {
    const value = (text ?? draft).trim();
    if (!value || isSending || exhausted) return;
    setPending(value);
    setDraft('');
    sendMessage(value, { onSettled: () => setPending(null) });
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  const isEmpty = messages.length === 0 && !pending;

  return (
    <div className="flex flex-col bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden h-full">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-primary-600" />
          <h2 className="text-sm font-bold text-gray-900">Edit with AI</h2>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          Tell me what to change — I&apos;ll update the itinerary live.
        </p>
      </div>

      <div className="flex-1 min-h-[280px] max-h-[460px] overflow-y-auto px-5 py-4">
        {mismatchSuggestions.length > 0 && (
          <div className="flex flex-col gap-2 mb-3 pb-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-amber-700">Fix the destination balance:</p>
            {mismatchSuggestions.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => submit(p)}
                disabled={exhausted}
                className="text-left text-sm text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 disabled:opacity-50 rounded-xl px-3 py-2 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        )}
        {isEmpty ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-gray-400 mb-1">Try one of these:</p>
            {EXAMPLE_PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => submit(p)}
                disabled={exhausted}
                className="text-left text-sm text-primary-700 bg-primary-50 hover:bg-primary-100 disabled:opacity-50 rounded-xl px-3 py-2 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m, i) => (
              <Bubble key={i} role={m.role} text={m.text} />
            ))}
            {pending && <Bubble role="user" text={pending} />}
            {isSending && (
              <div className="self-start flex items-center gap-2 bg-gray-100 text-gray-500 rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm">
                <Loader2 size={14} className="animate-spin" /> Updating your itinerary…
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 p-3">
        {exhausted ? (
          <p className="text-xs text-center text-gray-400 py-2">
            You&apos;ve used all your free AI edits. Complete your purchase to finish.
          </p>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              rows={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="e.g. Move day 3 to Lyon"
              disabled={isSending}
              className="flex-1 resize-none max-h-28 text-sm text-gray-800 placeholder-gray-400 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => submit()}
              disabled={isSending || !draft.trim()}
              className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-primary-700 hover:bg-primary-800 disabled:opacity-50 text-white transition-colors"
              aria-label="Send"
            >
              {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        )}
        <p className="text-[11px] text-gray-400 text-center mt-2">
          {Math.max(0, chatsRemaining)} free AI edit{chatsRemaining === 1 ? '' : 's'} left
        </p>
      </div>
    </div>
  );
}

function Bubble({ role, text }) {
  const isUser = role === 'user';
  return (
    <div
      className={`max-w-[85%] px-3.5 py-2.5 text-sm leading-snug ${
        isUser
          ? 'self-end bg-primary-700 text-white rounded-2xl rounded-tr-sm'
          : 'self-start bg-gray-100 text-gray-800 rounded-2xl rounded-tl-sm'
      }`}
    >
      {text}
    </div>
  );
}

export default function ItineraryPreviewPage({ sessionId }) {
  // Generation runs in the background server-side; poll until it settles.
  const { order, isLoadingOrder, isErrorOrder } = useItineraryOrder(sessionId, {
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return s === 'GENERATING' || s === 'DRAFT' ? 2500 : false;
    },
  });
  const { regenerateItinerary, isRegeneratingItinerary } = useRegenerateItinerary(sessionId);
  const { startItineraryCheckout, isStartingCheckout } = useItineraryCheckout();

  // GA4 view_item — once, when the (unpaid) preview is shown.
  const viewedRef = useRef(false);
  useEffect(() => {
    if (!viewedRef.current && order?.status === 'GENERATED' && order.paymentStatus !== 'PAID') {
      viewedRef.current = true;
      trackItineraryViewItem({ value: order.price, currency: order.currency });
    }
  }, [order]);

  if (isLoadingOrder) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-24 flex flex-col items-center gap-4">
        <Loader2 size={32} className="animate-spin text-primary-500" />
        <p className="text-sm text-gray-500">Loading your itinerary…</p>
      </div>
    );
  }

  if (isErrorOrder || !order) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-24 flex flex-col items-center gap-3 text-center">
        <AlertCircle size={28} className="text-gray-300" />
        <p className="text-sm text-gray-500">We couldn&apos;t find this itinerary.</p>
        <Link href="/itinerary-booking/form" className="text-sm font-semibold text-primary-700 hover:underline">
          Start a new itinerary
        </Link>
      </div>
    );
  }

  if (order.status === 'FAILED') {
    return (
      <div className="max-w-3xl mx-auto px-6 py-24 flex flex-col items-center gap-3 text-center">
        <AlertCircle size={28} className="text-accent-500" />
        <h1 className="text-lg font-bold text-gray-900">We couldn&apos;t generate a consistent itinerary</h1>
        <p className="text-sm text-gray-500 max-w-md">
          Please review your trip dates and cities and try again.
        </p>
        <Link href="/itinerary-booking/form" className="mt-2 text-sm font-semibold text-primary-700 hover:underline">
          Back to the form
        </Link>
      </div>
    );
  }

  const isGenerating = order.status === 'GENERATING' || order.status === 'DRAFT';
  const hasPreview = order.previewVersion > 0;

  // First generation — no preview rendered yet. Show a building state; the poll
  // above flips this to the real preview (or FAILED) when the server finishes.
  if (isGenerating && !hasPreview) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-24 flex flex-col items-center gap-4 text-center">
        <Loader2 size={32} className="animate-spin text-primary-500" />
        <h1 className="text-lg font-bold text-gray-900">Building your itinerary…</h1>
        <p className="text-sm text-gray-500 max-w-sm">
          Our AI is drafting your day-by-day plan and rendering the preview. This usually takes about 20–40 seconds.
        </p>
      </div>
    );
  }

  const isPaid = order.paymentStatus === 'PAID';
  const busy = isGenerating || isRegeneratingItinerary;
  const mismatch = order.mainDestinationCheck;
  const previewImg = (
    <div className="relative rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
      <img
        src={`${itineraryPreviewUrl(sessionId)}?v=${order.previewVersion}`}
        alt="Itinerary preview (watermarked)"
        className="w-full block"
      />
      {isGenerating && hasPreview && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2">
          <Loader2 size={28} className="animate-spin text-primary-500" />
          <p className="text-sm font-semibold text-gray-700">Updating your itinerary…</p>
        </div>
      )}
    </div>
  );

  // Paid: no chat — preview takes the full width + a fixed download bar.
  if (isPaid) {
    return (
      <>
        <div>
          <h1 className="text-lg font-bold text-gray-900 mb-3">Your itinerary</h1>
          {previewImg}
        </div>
        <div className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 shadow-2xl">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 text-primary-700 font-semibold text-sm">
              <ShieldCheck size={18} /> Paid — your clean PDF is ready
            </div>
            <a
              href={itineraryDocumentUrl(sessionId)}
              className="shrink-0 inline-flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-800 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-colors"
            >
              <Download size={15} /> Download PDF
            </a>
          </div>
        </div>
      </>
    );
  }

  // Pre-payment: Chat (left) | Preview (wider). Price/actions in a fixed bottom bar.
  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Chat (left on desktop, below preview on mobile) */}
        <div className="w-full lg:w-[380px] shrink-0 order-2 lg:order-1">
          <ChatPanel sessionId={sessionId} chatsRemaining={order.chatsRemaining} mismatch={mismatch} />
        </div>

        {/* Preview (main, takes the freed width) */}
        <div className="flex-1 min-w-0 order-1 lg:order-2">
          {mismatch?.hasMismatch && (
            <div className="mb-3 flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-4 py-3">
              <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm leading-snug">
                You&apos;re applying to <strong>{mismatch.applyingTo}</strong>, but this trip spends the most nights in{' '}
                <strong>{mismatch.mainDestination}</strong>. Embassies usually expect you to apply to your main
                destination, and a mismatch can mean rejection. You can fix the balance below or proceed anyway.
              </p>
            </div>
          )}
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-gray-900">Preview</h1>
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
              <Lock size={12} /> Watermarked preview
            </span>
          </div>
          {previewImg}
        </div>
      </div>

      {/* Fixed action bar (price · regenerate · pay) */}
      <div className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 shadow-2xl">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] text-gray-400 leading-none">One-time price</p>
            <p className="text-lg font-extrabold text-gray-900 leading-tight">
              {order.currency} {order.price}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => regenerateItinerary()}
              disabled={busy || order.regensRemaining <= 0}
              title={
                order.regensRemaining > 0
                  ? `${order.regensRemaining} free regeneration${order.regensRemaining > 1 ? 's' : ''} left`
                  : 'No regenerations left'
              }
              className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-primary-700 border border-primary-200 hover:bg-primary-50 disabled:opacity-50 px-4 py-2.5 rounded-xl transition-colors"
            >
              {busy ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={14} />}
              <span className="hidden sm:inline">Regenerate</span>
            </button>
            <button
              onClick={() => {
                trackItineraryBeginCheckout({ value: order.price, currency: order.currency });
                startItineraryCheckout(sessionId);
              }}
              disabled={isStartingCheckout || busy}
              className="inline-flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:opacity-70 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-colors"
            >
              {isStartingCheckout ? <Loader2 size={16} className="animate-spin" /> : null}
              Pay &amp; download
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
