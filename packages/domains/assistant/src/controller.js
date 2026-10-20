import { catchAsync } from '@travel-suite/utils';

function send(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  // compression() buffers the stream unless each write is flushed through it.
  res.flush?.();
}

export function createAssistantController({
  service,
  brand,
  model,
  datasets,
  stripe,
  stripeRoles,
  ads,
  adsRoles,
  adsWriteRoles,
  logger,
}) {
  const getMeta = (req, res) => {
    const role = req.user.role;
    res.status(200).json({
      status: 'success',
      data: {
        brand: brand.name,
        model,
        readOnly: true,
        stripe: Boolean(stripe) && stripeRoles.includes(role),
        ads: Boolean(ads) && adsRoles.includes(role),
        adsWrite: Boolean(ads) && adsWriteRoles.includes(role),
        datasets: datasets
          .filter((dataset) => dataset.roles.includes(role))
          .map((dataset) => ({ key: dataset.key, label: dataset.label, description: dataset.description })),
      },
    });
  };

  const getConversations = catchAsync(async (req, res) => {
    const conversations = await service.listConversations({ user: req.user, limit: req.query.limit });
    res.status(200).json({ status: 'success', data: { conversations } });
  });

  const getConversationById = catchAsync(async (req, res) => {
    const conversation = await service.getConversation({ user: req.user, id: req.params.id });
    res.status(200).json({ status: 'success', data: { conversation } });
  });

  const deleteConversationById = catchAsync(async (req, res) => {
    await service.deleteConversation({ user: req.user, id: req.params.id });
    res.status(204).send();
  });

  const getToolCalls = catchAsync(async (req, res) => {
    const { calls, pagination } = await service.listToolCalls(req.query);
    res.status(200).json({ status: 'success', data: { calls, pagination } });
  });

  const getUsage = catchAsync(async (req, res) => {
    const usage = await service.getUsage({ days: req.query.days });
    res.status(200).json({ status: 'success', data: { usage } });
  });

  const getActions = catchAsync(async (req, res) => {
    const actions = await service.listActions({ user: req.user, conversationId: req.query.conversationId });
    res.status(200).json({ status: 'success', data: { actions } });
  });

  const approveAction = catchAsync(async (req, res) => {
    const outcome = await service.decideAction({ user: req.user, id: req.params.id, approve: true });
    res.status(200).json({ status: 'success', data: { action: outcome } });
  });

  const cancelAction = catchAsync(async (req, res) => {
    const outcome = await service.decideAction({ user: req.user, id: req.params.id, approve: false });
    res.status(200).json({ status: 'success', data: { action: outcome } });
  });

  const postMessage = async (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flush?.();

    const controller = new AbortController();
    req.on('close', () => controller.abort());

    try {
      const outcome = await service.sendMessage({
        user: req.user,
        conversationId: req.body?.conversationId || null,
        message: req.body?.message,
        nav: req.body?.nav,
        signal: controller.signal,
        onEvent: (event) => send(res, event.type, event),
      });

      send(res, 'done', { type: 'done', ...outcome });
    } catch (err) {
      logger?.error('[assistant] message failed', {
        message: err.message,
        status: err.status ?? err.statusCode ?? null,
        userId: String(req.user._id),
        conversationId: req.body?.conversationId ?? null,
      });

      send(res, 'error', {
        type: 'error',
        message: err.isOperational
          ? err.message
          : 'Something went wrong on the way to the model. Try again, and start a new conversation if it keeps happening.',
      });
    } finally {
      res.end();
    }
  };

  return {
    getMeta,
    getConversations,
    getConversationById,
    deleteConversationById,
    getToolCalls,
    getUsage,
    getActions,
    approveAction,
    cancelAction,
    postMessage,
  };
}
