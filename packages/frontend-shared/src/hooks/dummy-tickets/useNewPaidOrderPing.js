'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

// Browsers block audio until the user has interacted with the page, so the first ping may be silent.
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

    const es = new EventSource(`${BACKEND}/api/tickets/events`, {
      withCredentials: true,
    });

    es.addEventListener('paid-order', () => {
      playPing();
      queryClient.invalidateQueries({ queryKey: ['dummytickets'] });
    });

    es.addEventListener('error', () => {
    });

    return () => es.close();
  }, [enabled, queryClient]);
}
