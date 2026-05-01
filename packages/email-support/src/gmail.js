import { google } from 'googleapis';

/**
 * Recursively walk MIME parts to extract body text.
 * Prefers text/plain; falls back to stripping HTML from text/html.
 */
function extractBody(payload) {
  if (!payload) return '';

  // Leaf node with data
  if (payload.body?.data) {
    const mimeType = payload.mimeType || '';
    const decoded = Buffer.from(payload.body.data, 'base64url').toString('utf-8');
    if (mimeType === 'text/plain') return decoded;
    if (mimeType === 'text/html') {
      // Strip HTML tags
      return decoded
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\s{2,}/g, '\n')
        .trim();
    }
    return decoded;
  }

  // Multipart — search parts
  if (payload.parts && payload.parts.length > 0) {
    // Try text/plain first
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain') {
        const text = extractBody(part);
        if (text) return text;
      }
    }
    // Then multipart children (e.g. multipart/alternative)
    for (const part of payload.parts) {
      if (part.mimeType?.startsWith('multipart/')) {
        const text = extractBody(part);
        if (text) return text;
      }
    }
    // Fallback to HTML
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html') {
        const text = extractBody(part);
        if (text) return text;
      }
    }
    // Last resort: any part
    for (const part of payload.parts) {
      const text = extractBody(part);
      if (text) return text;
    }
  }

  return '';
}

function parseFrom(fromHeader) {
  if (!fromHeader) return { fromEmail: '', fromName: '' };
  // "Name <email@domain.com>"
  const match = fromHeader.match(/^(.*?)\s*<([^>]+)>\s*$/);
  if (match) {
    return {
      fromName: match[1].trim().replace(/^"|"$/g, ''),
      fromEmail: match[2].trim(),
    };
  }
  // Just an email
  return { fromEmail: fromHeader.trim(), fromName: '' };
}

function getHeader(headers, name) {
  const h = headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase());
  return h?.value || '';
}

export function createGmailClient({ clientId, clientSecret, refreshToken, user }) {
  const auth = new google.auth.OAuth2(clientId, clientSecret);
  auth.setCredentials({ refresh_token: refreshToken });

  const gmail = google.gmail({ version: 'v1', auth });

  async function listUnprocessedMessages(processedIds) {
    const res = await gmail.users.messages.list({
      userId: 'me',
      q: 'in:inbox',
      maxResults: 20,
    });

    const messages = res.data.messages || [];
    return messages
      .map((m) => m.id)
      .filter((id) => !processedIds.has(id));
  }

  async function getMessage(id) {
    const res = await gmail.users.messages.get({
      userId: 'me',
      id,
      format: 'full',
    });

    const msg = res.data;
    const headers = msg.payload?.headers || [];
    const threadId = msg.threadId;
    const from = getHeader(headers, 'From');
    const subject = getHeader(headers, 'Subject');
    const dateHeader = getHeader(headers, 'Date');
    const receivedAt = dateHeader ? new Date(dateHeader) : new Date(Number(msg.internalDate));
    const bodyText = extractBody(msg.payload);

    const { fromEmail, fromName } = parseFrom(from);

    return { threadId, from, fromEmail, fromName, subject, bodyText, receivedAt };
  }

  async function sendReply({ to, subject, threadId, inReplyToMessageId, body }) {
    const replySubject = subject?.toLowerCase().startsWith('re:') ? subject : `Re: ${subject}`;

    const lines = [
      `To: ${to}`,
      `From: ${user}`,
      `Subject: ${replySubject}`,
      `In-Reply-To: ${inReplyToMessageId}`,
      `References: ${inReplyToMessageId}`,
      `Content-Type: text/plain; charset="UTF-8"`,
      `MIME-Version: 1.0`,
      '',
      body,
    ];

    const raw = lines.join('\r\n');
    const encoded = Buffer.from(raw)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    return gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encoded, threadId },
    });
  }

  async function markAsRead(id) {
    await gmail.users.messages.modify({
      userId: 'me',
      id,
      requestBody: { removeLabelIds: ['UNREAD'] },
    });
  }

  return { listUnprocessedMessages, getMessage, sendReply, markAsRead };
}
