import { AppError, logger } from '@travel-suite/utils';

const WINDOW_MS = 24 * 60 * 60 * 1000;

// Mongoose 9's lean() drops schema virtuals, so the window expiry is attached here instead.
function withWindow(conversation) {
  if (!conversation) return conversation;
  return {
    ...conversation,
    windowExpiresAt: conversation.lastInboundAt
      ? new Date(new Date(conversation.lastInboundAt).getTime() + WINDOW_MS)
      : null,
  };
}

function previewOf(message) {
  if (message.text) return message.text.slice(0, 140);
  return `[${message.type}]`;
}

export function createConversationService({ Conversation, Message, SavedReply, whatsapp }) {
  const listConversations = async ({ status, limit = 50 } = {}) => {
    const query = {};
    if (status) query.status = status;
    const conversations = await Conversation.find(query)
      .sort({ lastMessageAt: -1 })
      .limit(Math.min(Number(limit) || 50, 200))
      .populate('assignedTo', 'name email')
      .lean();
    return conversations.map(withWindow);
  };

  const getThread = async ({ waId, limit = 100 }) => {
    const conversation = await Conversation.findOne({ waId })
      .populate('assignedTo', 'name email')
      .lean();
    if (!conversation) return null;
    const messages = await Message.find({ conversation: conversation._id })
      .sort({ sentAt: 1 })
      .limit(Math.min(Number(limit) || 100, 500))
      .lean();
    return { conversation: withWindow(conversation), messages };
  };

  const markRead = async ({ waId }) => {
    const conversation = await Conversation.findOneAndUpdate(
      { waId },
      { $set: { unreadCount: 0 } },
      { new: true },
    );
    return conversation;
  };

  const recordInboundMessage = async ({ waId, profileName, wamid, type, text, media, sentAt }) => {
    const conversation = await Conversation.findOneAndUpdate(
      { waId },
      {
        $set: {
          ...(profileName ? { profileName } : {}),
          lastInboundAt: sentAt,
          lastMessageAt: sentAt,
          lastMessagePreview: previewOf({ text, type }),
          status: 'OPEN',
        },
        $inc: { unreadCount: 1 },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    try {
      const message = await Message.create({
        conversation: conversation._id,
        waId,
        wamid,
        direction: 'INBOUND',
        type,
        text: text ?? null,
        media: media ?? undefined,
        status: 'RECEIVED',
        sentAt,
      });
      return { conversation, message, duplicate: false };
    } catch (err) {
      // Duplicate wamid: Meta resent an event we already stored. Undo the unread bump.
      if (err?.code === 11000) {
        await Conversation.updateOne({ _id: conversation._id }, { $inc: { unreadCount: -1 } });
        logger.info('[conversations] duplicate inbound message ignored', { wamid });
        return { conversation, message: null, duplicate: true };
      }
      throw err;
    }
  };

  const recordStatusUpdate = async ({ wamid, status, error }) => {
    const mapped = { sent: 'SENT', delivered: 'DELIVERED', read: 'READ', failed: 'FAILED' }[status];
    if (!mapped) return null;
    return Message.findOneAndUpdate(
      { wamid },
      { $set: { status: mapped, ...(error ? { error } : {}) } },
      { new: true },
    );
  };

  const sendMessage = async ({ waId, text, sentBy }) => {
    const body = text?.trim();
    if (!body) throw new AppError('Message cannot be empty', 400);
    if (!whatsapp?.isConfigured()) throw new AppError('WhatsApp sending is not configured', 503);

    const conversation = await Conversation.findOne({ waId });
    if (!conversation) throw new AppError('Conversation not found', 404);
    if (!isWindowOpen(conversation)) {
      throw new AppError(
        'The 24 hour reply window has closed. Only an approved template can reopen this chat.',
        409,
      );
    }

    // Send first: without a wamid from Meta there is nothing to reconcile delivery statuses against.
    const { wamid } = await whatsapp.sendText({ to: waId, text: body });
    if (!wamid) throw new AppError('WhatsApp accepted the message but returned no id', 502);

    const sentAt = new Date();
    const message = await Message.create({
      conversation: conversation._id,
      waId,
      wamid,
      direction: 'OUTBOUND',
      type: 'text',
      text: body,
      status: 'SENT',
      sentBy: sentBy ?? null,
      sentAt,
    });

    await Conversation.updateOne(
      { _id: conversation._id },
      { $set: { lastMessageAt: sentAt, lastMessagePreview: previewOf({ text: body, type: 'text' }) } },
    );

    return message;
  };

  const sendMediaMessage = async ({ waId, file, caption, sentBy }) => {
    if (!file?.buffer) throw new AppError('A file is required', 400);
    if (!whatsapp?.isConfigured()) throw new AppError('WhatsApp sending is not configured', 503);

    const conversation = await Conversation.findOne({ waId });
    if (!conversation) throw new AppError('Conversation not found', 404);
    if (!isWindowOpen(conversation)) {
      throw new AppError(
        'The 24 hour reply window has closed. Only an approved template can reopen this chat.',
        409,
      );
    }

    const mediaId = await whatsapp.uploadMedia({
      buffer: file.buffer,
      mimeType: file.mimetype,
      filename: file.originalname,
    });
    if (!mediaId) throw new AppError('WhatsApp rejected the upload', 502);

    const { wamid, kind } = await whatsapp.sendMedia({
      to: waId,
      mediaId,
      mimeType: file.mimetype,
      filename: file.originalname,
      caption,
    });
    if (!wamid) throw new AppError('WhatsApp accepted the file but returned no id', 502);

    const sentAt = new Date();
    const message = await Message.create({
      conversation: conversation._id,
      waId,
      wamid,
      direction: 'OUTBOUND',
      type: kind,
      text: caption?.trim() || null,
      media: {
        id: mediaId,
        mimeType: file.mimetype,
        filename: file.originalname,
        caption: caption?.trim() || null,
      },
      status: 'SENT',
      sentBy: sentBy ?? null,
      sentAt,
    });

    await Conversation.updateOne(
      { _id: conversation._id },
      { $set: { lastMessageAt: sentAt, lastMessagePreview: `[${kind}] ${file.originalname ?? ''}`.trim() } },
    );

    return message;
  };

  const listSavedReplies = () => SavedReply.find().sort({ title: 1 }).lean();

  const createSavedReply = async ({ title, body, createdBy }) => {
    if (!title?.trim() || !body?.trim()) throw new AppError('Title and body are required', 400);
    return SavedReply.create({ title: title.trim(), body: body.trim(), createdBy: createdBy ?? null });
  };

  const updateSavedReply = async ({ id, title, body }) => {
    const updated = await SavedReply.findByIdAndUpdate(
      id,
      { $set: { ...(title ? { title: title.trim() } : {}), ...(body ? { body: body.trim() } : {}) } },
      { new: true },
    );
    if (!updated) throw new AppError('Saved reply not found', 404);
    return updated;
  };

  const deleteSavedReply = async (id) => {
    const deleted = await SavedReply.findByIdAndDelete(id);
    if (!deleted) throw new AppError('Saved reply not found', 404);
    return deleted;
  };

  const isWindowOpen = (conversation) =>
    Boolean(conversation?.lastInboundAt) &&
    Date.now() - new Date(conversation.lastInboundAt).getTime() < WINDOW_MS;

  return {
    listConversations, getThread, markRead, sendMessage, sendMediaMessage,
    listSavedReplies, createSavedReply, updateSavedReply, deleteSavedReply,
    recordInboundMessage, recordStatusUpdate, isWindowOpen,
  };
}
