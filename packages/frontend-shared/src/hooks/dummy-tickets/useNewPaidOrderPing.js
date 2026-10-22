'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getLatestPaidTicketApi } from '../../services/apiDummyTickets.js';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;
const POLL_INTERVAL_MS = 45_000;

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

export function useNewPaidOrderPing({ enabled = true } = {}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !BACKEND) return;

    let cancelled = false;
    const seen = new Set();

    const announce = (sessionId) => {
      if (!sessionId || seen.has(sessionId)) return;
      seen.add(sessionId);
      playPing();
      queryClient.invalidateQueries({ queryKey: ['dummytickets'] });
      queryClient.invalidateQueries({ queryKey: ['nav-badges'] });
    };

    const es = new EventSource(`${BACKEND}/api/tickets/events`, {
      withCredentials: true,
    });

    es.addEventListener('paid-order', (event) => {
      let sessionId = null;
      try {
        sessionId = JSON.parse(event.data)?.sessionId ?? null;
      } catch {
        void 0;
      }
      if (sessionId) return announce(sessionId);
      playPing();
      queryClient.invalidateQueries({ queryKey: ['dummytickets'] });
      queryClient.invalidateQueries({ queryKey: ['nav-badges'] });
    });

    es.addEventListener('error', () => {
    });

    // The event bus lives in one backend process, so polling covers orders paid on another machine.
    const poll = async ({ silent = false } = {}) => {
      try {
        const latest = await getLatestPaidTicketApi();
        if (cancelled || !latest?.sessionId) return;
        if (silent) seen.add(latest.sessionId);
        else announce(latest.sessionId);
      } catch {
        void 0;
      }
    };

    poll({ silent: true });
    const interval = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
      es.close();
    };
  }, [enabled, queryClient]);
}
