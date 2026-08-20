export function createConversationController({ service }) {
  const listConversations = async (req, res, next) => {
    try {
      const data = await service.listConversations({ status: req.query.status, limit: req.query.limit });
      res.json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  };

  const getThread = async (req, res, next) => {
    try {
      const thread = await service.getThread({ waId: req.params.waId, limit: req.query.limit });
      if (!thread) return res.status(404).json({ status: 'fail', message: 'Conversation not found' });
      res.json({ status: 'success', data: thread });
    } catch (err) {
      next(err);
    }
  };

  const markRead = async (req, res, next) => {
    try {
      const conversation = await service.markRead({ waId: req.params.waId });
      if (!conversation) return res.status(404).json({ status: 'fail', message: 'Conversation not found' });
      res.json({ status: 'success', data: conversation });
    } catch (err) {
      next(err);
    }
  };

  const sendMessage = async (req, res, next) => {
    try {
      const message = await service.sendMessage({
        waId: req.params.waId,
        text: req.body?.text,
        replyTo: req.body?.replyTo ?? null,
        sentBy: req.user?._id ?? null,
      });
      res.status(201).json({ status: 'success', data: message });
    } catch (err) {
      next(err);
    }
  };

  const sendMediaMessage = async (req, res, next) => {
    try {
      const message = await service.sendMediaMessage({
        waId: req.params.waId,
        file: req.file,
        caption: req.body?.caption,
        replyTo: req.body?.replyTo ?? null,
        sentBy: req.user?._id ?? null,
      });
      res.status(201).json({ status: 'success', data: message });
    } catch (err) {
      next(err);
    }
  };

  const listAssignableAgents = async (_req, res, next) => {
    try {
      res.json({ status: 'success', data: await service.listAssignableAgents() });
    } catch (err) {
      next(err);
    }
  };

  const claimConversation = async (req, res, next) => {
    try {
      const conversation = await service.claimConversation({
        waId: req.params.waId,
        adminUserId: req.user?._id,
      });
      res.json({ status: 'success', data: conversation });
    } catch (err) {
      next(err);
    }
  };

  const assignConversation = async (req, res, next) => {
    try {
      const conversation = await service.assignConversation({
        waId: req.params.waId,
        adminUserId: req.body?.adminUserId ?? null,
      });
      res.json({ status: 'success', data: conversation });
    } catch (err) {
      next(err);
    }
  };

  const getMedia = async (req, res, next) => {
    try {
      const { buffer, mimeType, filename } = await service.getMedia({ messageId: req.params.messageId });
      const disposition = mimeType.startsWith('image/') ? 'inline' : 'attachment';
      res.set({
        'Content-Type': mimeType,
        'Content-Length': buffer.length,
        'Content-Disposition': `${disposition}; filename="${encodeURIComponent(filename)}"`,
        'Cache-Control': 'private, max-age=300',
      });
      res.send(buffer);
    } catch (err) {
      next(err);
    }
  };

  const listSavedReplies = async (_req, res, next) => {
    try {
      res.json({ status: 'success', data: await service.listSavedReplies() });
    } catch (err) {
      next(err);
    }
  };

  const createSavedReply = async (req, res, next) => {
    try {
      const reply = await service.createSavedReply({
        title: req.body?.title,
        body: req.body?.body,
        createdBy: req.user?._id ?? null,
      });
      res.status(201).json({ status: 'success', data: reply });
    } catch (err) {
      next(err);
    }
  };

  const updateSavedReply = async (req, res, next) => {
    try {
      const reply = await service.updateSavedReply({
        id: req.params.id,
        title: req.body?.title,
        body: req.body?.body,
      });
      res.json({ status: 'success', data: reply });
    } catch (err) {
      next(err);
    }
  };

  const deleteSavedReply = async (req, res, next) => {
    try {
      await service.deleteSavedReply(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  return {
    listConversations, getThread, markRead, sendMessage, sendMediaMessage, getMedia,
    listAssignableAgents, claimConversation, assignConversation,
    listSavedReplies, createSavedReply, updateSavedReply, deleteSavedReply,
  };
}
