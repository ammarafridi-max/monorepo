import { getOpenAIBrowserIds, openaiWhatsappClicked } from './openaiPixel.js';

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

const newEventId = () =>
  `wa:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 10)}`;

export function reportWhatsappClick() {
  if (typeof window === 'undefined') return;

  const eventId = newEventId();
  openaiWhatsappClicked({ eventId });

  if (!BACKEND) return;
  const { oppref, obref } = getOpenAIBrowserIds();
  const body = JSON.stringify({ eventId, sourceUrl: window.location.href, oppref, obref });

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        `${BACKEND}/api/openai-events/whatsapp-click`,
        new Blob([body], { type: 'application/json' }),
      );
      return;
    }
  } catch {}

  fetch(`${BACKEND}/api/openai-events/whatsapp-click`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {});
}
