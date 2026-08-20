// Deliberately unlike the new-order ping (880 -> 660 sine): three rising triangle
// notes, so agents can tell a customer message from a sale without looking.
export function playChatPing() {
  if (typeof window === 'undefined') return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  try {
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    [
      { freq: 523.25, start: 0,    duration: 0.1 },
      { freq: 659.25, start: 0.1,  duration: 0.1 },
      { freq: 783.99, start: 0.2,  duration: 0.16 },
    ].forEach(({ freq, start, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.18, now + start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + duration + 0.02);
    });
    setTimeout(() => ctx.close().catch(() => {}), 1200);
  } catch {
    void 0;
  }
}
