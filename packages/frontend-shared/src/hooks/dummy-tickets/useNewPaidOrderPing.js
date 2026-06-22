'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

// Two-tone "ding" via Web Audio API — avoids shipping an mp3 and works
// in any modern browser. Browsers block audio until the user has
// interacted with the page at least once, so on a freshly-loaded tab
// the first ping after sign-in may be silent.
function playPing() {
  if (typeof window === 'undefined') return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  try {
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    [
      { freq: 880, start: 0,    duration: 0.18 },
      { freq: 660, start: 0.18, duration: 0.24 },
    ].forEach(({ freq, start, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.25, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + duration + 0.02);
    });
    setTimeout(() => ctx.close().catch(() => {}), 1000);
  } catch {
    void 0;
  }
}

// Holds a single Server-Sent Events connection to /api/tickets/events
// for the lifetime of the admin shell. The server pushes a `paid-order`
// event the instant a payment is confirmed — no polling, no 30s window.
//
// EventSource auto-reconnects with a 5s back-off (set server-side via
// `retry:`) and keeps working across tab visibility changes, so a
// payment that happens while the admin is on another tab still fires
// the ping the moment focus returns the AudioContext to a runnable
// state (or immediately, if it's still runnable).
export function useNewPaidOrderPing({ enabled = true } = {}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !BACKEND) return;

    const es = new EventSource(`${BACKEND}/api/tickets/events`, {
      withCredentials: true,
    });

    es.addEventListener('paid-order', () => {
      playPing();
      queryClient.invalidateQueries({ queryKey: ['dummytickets'] });
    });

    // EventSource auto-reconnects on error; log once for visibility.
    es.addEventListener('error', () => {
      // No console noise — reconnect is automatic. Surface only if needed.
    });

    return () => es.close();
  }, [enabled, queryClient]);
}
