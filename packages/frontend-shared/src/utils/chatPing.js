const SOUND_URL = '/sounds/message-notification.m4a';

let audio = null;

// Falls back to synthesised tones if the file is missing, so a new brand adopting the
// inbox still gets an audible alert before anyone drops the asset in public/sounds.
function playFallbackTones() {
  if (typeof window === 'undefined') return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  try {
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    [
      { freq: 523.25, start: 0,   duration: 0.1 },
      { freq: 659.25, start: 0.1, duration: 0.1 },
      { freq: 783.99, start: 0.2, duration: 0.16 },
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

// Browsers block audio until the user has interacted with the page, so the first ping may be silent.
export function playChatPing() {
  if (typeof window === 'undefined') return;
  try {
    if (!audio) {
      audio = new Audio(SOUND_URL);
      audio.preload = 'auto';
    }
    audio.currentTime = 0;
    audio.play().catch(playFallbackTones);
  } catch {
    playFallbackTones();
  }
}
