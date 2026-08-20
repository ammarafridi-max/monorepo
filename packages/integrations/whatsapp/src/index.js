const GRAPH_URL = 'https://graph.facebook.com/v23.0';

const parseBody = async (res) => {
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return { raw: text }; }
};

export function createWhatsAppClient({ accessToken, phoneNumberId, logger } = {}) {
  const isConfigured = () => Boolean(accessToken && phoneNumberId);

  const post = async (action, body) => {
    const res = await fetch(`${GRAPH_URL}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messaging_product: 'whatsapp', ...body }),
    });
    const json = await parseBody(res);
    if (!res.ok) {
      const detail = json?.error?.message ?? `HTTP ${res.status}`;
      logger?.warn('[whatsapp] request failed', { action, status: res.status, detail });
      const error = new Error(detail);
      error.status = res.status;
      error.code = json?.error?.code;
      throw error;
    }
    return json;
  };

  const sendText = async ({ to, text, replyToWamid }) => {
    const json = await post('sendText', {
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { preview_url: false, body: text },
      ...(replyToWamid ? { context: { message_id: replyToWamid } } : {}),
    });
    return { wamid: json?.messages?.[0]?.id ?? null };
  };

  const uploadMedia = async ({ buffer, mimeType, filename }) => {
    const form = new FormData();
    form.append('messaging_product', 'whatsapp');
    form.append('type', mimeType);
    form.append('file', new Blob([buffer], { type: mimeType }), filename || 'upload');

    const res = await fetch(`${GRAPH_URL}/${phoneNumberId}/media`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    });
    const json = await parseBody(res);
    if (!res.ok) {
      const detail = json?.error?.message ?? `HTTP ${res.status}`;
      logger?.warn('[whatsapp] media upload failed', { status: res.status, detail });
      const error = new Error(detail);
      error.status = res.status;
      throw error;
    }
    return json?.id ?? null;
  };

  // WhatsApp routes media by kind, and only documents carry a filename.
  const mediaKindFor = (mimeType = '') => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'document';
  };

  const sendMedia = async ({ to, mediaId, mimeType, filename, caption, replyToWamid }) => {
    const kind = mediaKindFor(mimeType);
    const payload = { id: mediaId };
    if (caption && kind !== 'audio') payload.caption = caption;
    if (kind === 'document' && filename) payload.filename = filename;

    const json = await post('sendMedia', {
      recipient_type: 'individual',
      to,
      type: kind,
      [kind]: payload,
      ...(replyToWamid ? { context: { message_id: replyToWamid } } : {}),
    });
    return { wamid: json?.messages?.[0]?.id ?? null, kind };
  };

  const getMediaUrl = async (mediaId) => {
    const res = await fetch(`${GRAPH_URL}/${mediaId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const json = await parseBody(res);
    if (!res.ok) return null;
    return json?.url ?? null;
  };

  const downloadMedia = async (url) => {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  };

  const markRead = async ({ wamid }) => {
    try {
      await post('markRead', { status: 'read', message_id: wamid });
      return true;
    } catch {
      // Read receipts are cosmetic; a failure must never block the agent's reply.
      return false;
    }
  };

  return { isConfigured, sendText, uploadMedia, sendMedia, getMediaUrl, downloadMedia, markRead };
}
