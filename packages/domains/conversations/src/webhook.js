import crypto from 'crypto';
import { logger } from '@travel-suite/utils';

function isValidSignature({ rawBody, signatureHeader, appSecret }) {
  if (!signatureHeader?.startsWith('sha256=')) return false;
  const expected = crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');
  const received = signatureHeader.slice('sha256='.length);
  const expectedBuf = Buffer.from(expected, 'utf8');
  const receivedBuf = Buffer.from(received, 'utf8');
  if (expectedBuf.length !== receivedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}

function parseInbound(message, contact) {
  const base = {
    wamid: message.id,
    sentAt: new Date(Number(message.timestamp) * 1000),
    type: message.type,
    profileName: contact?.profile?.name ?? null,
    waId: message.from,
  };

  if (message.type === 'text') return { ...base, text: message.text?.body ?? '' };

  const mediaPayload = message[message.type];
  if (mediaPayload?.id) {
    return {
      ...base,
      text: mediaPayload.caption ?? null,
      media: {
        id: mediaPayload.id,
        mimeType: mediaPayload.mime_type ?? null,
        filename: mediaPayload.filename ?? null,
        caption: mediaPayload.caption ?? null,
      },
    };
  }

  return { ...base, text: null };
}

export function createWhatsAppWebhookHandlers({ service, appSecret, verifyToken, onInboundMessage }) {
  const verify = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === verifyToken) {
      logger.info('[whatsapp] webhook verified');
      return res.status(200).send(challenge);
    }
    logger.warn('[whatsapp] webhook verification rejected');
    return res.sendStatus(403);
  };

  const receive = async (req, res) => {
    const rawBody = req.body;
    if (!Buffer.isBuffer(rawBody)) {
      logger.error('[whatsapp] webhook body is not raw — check middleware order in app.js');
      return res.sendStatus(500);
    }
    if (!isValidSignature({ rawBody, signatureHeader: req.get('x-hub-signature-256'), appSecret })) {
      logger.warn('[whatsapp] webhook signature rejected');
      return res.sendStatus(403);
    }

    // Ack before processing: Meta retries on anything slower than a few seconds.
    res.sendStatus(200);

    try {
      const payload = JSON.parse(rawBody.toString('utf8'));
      for (const entry of payload.entry ?? []) {
        for (const change of entry.changes ?? []) {
          const value = change.value ?? {};

          for (const status of value.statuses ?? []) {
            await service.recordStatusUpdate({
              wamid: status.id,
              status: status.status,
              error: status.errors?.[0]?.title ?? null,
            });
          }

          for (const message of value.messages ?? []) {
            const contact = value.contacts?.find((c) => c.wa_id === message.from);
            const parsed = parseInbound(message, contact);
            const result = await service.recordInboundMessage(parsed);
            if (!result.duplicate) onInboundMessage?.(result);
          }
        }
      }
    } catch (err) {
      logger.error('[whatsapp] webhook processing failed', { message: err.message });
    }
  };

  return { verify, receive };
}
