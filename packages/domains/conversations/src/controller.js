import { catchAsync } from '@travel-suite/utils';

export function createConversationController({ service }) {
  const listConversations = catchAsync(async (req, res) => {
    const data = await service.listConversations({ status: req.query.status, limit: req.query.limit });
    res.json({ status: 'success', data });
  });

  const getThread = catchAsync(async (req, res) => {
    const thread = await service.getThread({ waId: req.params.waId, limit: req.query.limit });
    if (!thread) return res.status(404).json({ status: 'fail', message: 'Conversation not found' });
    res.json({ status: 'success', data: thread });
  });

  const markRead = catchAsync(async (req, res) => {
    const conversation = await service.markRead({ waId: req.params.waId });
    if (!conversation) return res.status(404).json({ status: 'fail', message: 'Conversation not found' });
    res.json({ status: 'success', data: conversation });
  });

  const sendMessage = catchAsync(async (req, res) => {
    const message = await service.sendMessage({
      waId: req.params.waId,
      text: req.body?.text,
      replyTo: req.body?.replyTo ?? null,
      sentBy: req.user?._id ?? null,
    });
    res.status(201).json({ status: 'success', data: message });
  });

  const sendMediaMessage = catchAsync(async (req, res) => {
    const message = await service.sendMediaMessage({
      waId: req.params.waId,
      file: req.file,
      caption: req.body?.caption,
      replyTo: req.body?.replyTo ?? null,
      sentBy: req.user?._id ?? null,
    });
    res.status(201).json({ status: 'success', data: message });
  });

  const listAssignableAgents = catchAsync(async (_req, res) => {
    res.json({ status: 'success', data: await service.listAssignableAgents() });
  });

  const claimConversation = catchAsync(async (req, res) => {
    const conversation = await service.claimConversation({
      waId: req.params.waId,
      adminUserId: req.user?._id,
    });
    res.json({ status: 'success', data: conversation });
  });

  const assignConversation = catchAsync(async (req, res) => {
    const conversation = await service.assignConversation({
      waId: req.params.waId,
      adminUserId: req.body?.adminUserId ?? null,
    });
    res.json({ status: 'success', data: conversation });
  });

  const getMedia = catchAsync(async (req, res) => {
    const { buffer, mimeType, filename } = await service.getMedia({ messageId: req.params.messageId });
    const disposition = mimeType.startsWith('image/') ? 'inline' : 'attachment';
    res.set({
      'Content-Type': mimeType,
      'Content-Length': buffer.length,
      'Content-Disposition': `${disposition}; filename="${encodeURIComponent(filename)}"`,
      'Cache-Control': 'private, max-age=300',
    });
    res.send(buffer);
  });

  const listSavedReplies = catchAsync(async (_req, res) => {
    res.json({ status: 'success', data: await service.listSavedReplies() });
  });

  const createSavedReply = catchAsync(async (req, res) => {
    const reply = await service.createSavedReply({
      title: req.body?.title,
      body: req.body?.body,
      createdBy: req.user?._id ?? null,
    });
    res.status(201).json({ status: 'success', data: reply });
  });

  const updateSavedReply = catchAsync(async (req, res) => {
    const reply = await service.updateSavedReply({
      id: req.params.id,
      title: req.body?.title,
      body: req.body?.body,
    });
    res.json({ status: 'success', data: reply });
  });

  const deleteSavedReply = catchAsync(async (req, res) => {
    await service.deleteSavedReply(req.params.id);
    res.status(204).send();
  });

  return {
    listConversations, getThread, markRead, sendMessage, sendMediaMessage, getMedia,
    listAssignableAgents, claimConversation, assignConversation,
    listSavedReplies, createSavedReply, updateSavedReply, deleteSavedReply,
  };
}
