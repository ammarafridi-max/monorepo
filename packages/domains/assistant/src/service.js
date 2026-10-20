import { AppError } from '@travel-suite/utils';
import { executeAdsAction } from './ads-tools.js';
import { datasetsForRole } from './datasets.js';
import { buildSystemPrompt, sanitiseNav } from './prompt.js';
import { buildToolDefinitions, executeTool } from './tools.js';

const MAX_MESSAGE_LENGTH = 4000;

export function repairToolUse(content) {
  if (!Array.isArray(content)) return content;

  return content.map((block) =>
    block?.type === 'tool_use' && (block.input === null || block.input === undefined)
      ? { ...block, input: {} }
      : block,
  );
}

function withoutToolUse(content) {
  return Array.isArray(content) ? content.filter((block) => block.type !== 'tool_use') : content;
}

function firstText(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content.filter((block) => block.type === 'text').map((block) => block.text).join('').trim();
}

export function createAssistantService({
  anthropic,
  Conversation,
  ToolCall,
  Action,
  datasets,
  stripe,
  stripeRoles,
  ads,
  adsRoles,
  adsWriteRoles,
  actionTtlMinutes,
  brand,
  model,
  effort,
  maxTokens,
  maxToolRounds,
  historyLimit,
  logger,
}) {
  async function listConversations({ user, limit = 30 }) {
    const docs = await Conversation.find({ user: user._id })
      .select('title lastMessageAt createdAt')
      .sort({ lastMessageAt: -1 })
      .limit(Math.min(Number(limit) || 30, 100))
      .lean();

    return docs.map((doc) => ({
      id: String(doc._id),
      title: doc.title,
      lastMessageAt: doc.lastMessageAt,
      createdAt: doc.createdAt,
    }));
  }

  async function getConversation({ user, id }) {
    const doc = await Conversation.findOne({ _id: id, user: user._id }).lean();
    if (!doc) throw new AppError('Conversation not found', 404);

    const messages = [];
    for (const turn of doc.turns) {
      if (turn.role === 'user') {
        if (typeof turn.content === 'string') messages.push({ role: 'user', text: turn.content, at: turn.at });
        continue;
      }
      const text = firstText(turn.content);
      const tools = (Array.isArray(turn.content) ? turn.content : [])
        .filter((block) => block.type === 'tool_use')
        .map((block) => ({ name: block.name, input: block.input }));
      if (text || tools.length) messages.push({ role: 'assistant', text, tools, at: turn.at });
    }

    return { id: String(doc._id), title: doc.title, messages };
  }

  async function deleteConversation({ user, id }) {
    const result = await Conversation.deleteOne({ _id: id, user: user._id });
    if (!result.deletedCount) throw new AppError('Conversation not found', 404);
  }

  async function recordToolCall({ user, conversationId, name, input, dataset, rowCount, unmasked, durationMs, error }) {
    try {
      await ToolCall.create({
        user: user._id,
        userName: user.name,
        role: user.role,
        conversation: conversationId,
        tool: name,
        dataset: dataset ?? input?.dataset ?? (name.startsWith('stripe_') ? 'stripe' : null),
        input,
        rowCount,
        unmasked,
        durationMs,
        error: error ?? null,
      });
    } catch (err) {
      logger?.error('[assistant] failed to write the tool call audit record', { message: err.message });
    }
  }

  async function listToolCalls({ page = 1, limit = 50, dataset, tool, userId, from, to } = {}) {
    const size = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const current = Math.max(Number(page) || 1, 1);

    const query = {};
    if (dataset) query.dataset = dataset;
    if (tool) query.tool = tool;
    if (userId) query.user = userId;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lt = new Date(to);
    }

    const [rows, total] = await Promise.all([
      ToolCall.find(query).sort({ createdAt: -1 }).skip((current - 1) * size).limit(size).lean(),
      ToolCall.countDocuments(query),
    ]);

    return {
      calls: rows.map((row) => ({
        id: String(row._id),
        at: row.createdAt,
        user: row.userName ?? null,
        role: row.role ?? null,
        tool: row.tool,
        dataset: row.dataset,
        rowCount: row.rowCount,
        unmasked: row.unmasked,
        durationMs: row.durationMs,
        error: row.error,
        input: row.input,
      })),
      pagination: { page: current, limit: size, total, pages: Math.ceil(total / size) || 1 },
    };
  }

  async function getUsage({ days = 30 } = {}) {
    const since = new Date(Date.now() - Math.min(Math.max(Number(days) || 30, 1), 365) * 86400000);

    const [totals] = await Conversation.aggregate([
      { $match: { lastMessageAt: { $gte: since } } },
      {
        $group: {
          _id: null,
          conversations: { $sum: 1 },
          requests: { $sum: '$usage.requests' },
          inputTokens: { $sum: '$usage.inputTokens' },
          outputTokens: { $sum: '$usage.outputTokens' },
          cacheReadTokens: { $sum: '$usage.cacheReadTokens' },
        },
      },
    ]);

    const perUser = await Conversation.aggregate([
      { $match: { lastMessageAt: { $gte: since } } },
      {
        $group: {
          _id: '$user',
          conversations: { $sum: 1 },
          inputTokens: { $sum: '$usage.inputTokens' },
          outputTokens: { $sum: '$usage.outputTokens' },
        },
      },
      { $sort: { inputTokens: -1 } },
      { $limit: 20 },
    ]);

    const names = await resolveUserNames(perUser.map((row) => row._id));

    const [tools, failures, unmasked] = await Promise.all([
      ToolCall.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$tool', calls: { $sum: 1 }, rows: { $sum: '$rowCount' } } },
        { $sort: { calls: -1 } },
      ]),
      ToolCall.countDocuments({ createdAt: { $gte: since }, error: { $ne: null } }),
      ToolCall.countDocuments({ createdAt: { $gte: since }, unmasked: true }),
    ]);

    return {
      since,
      days: Number(days) || 30,
      totals: {
        conversations: totals?.conversations ?? 0,
        requests: totals?.requests ?? 0,
        inputTokens: totals?.inputTokens ?? 0,
        outputTokens: totals?.outputTokens ?? 0,
        cacheReadTokens: totals?.cacheReadTokens ?? 0,
      },
      failures,
      unmasked,
      tools: tools.map((row) => ({ tool: row._id, calls: row.calls, rows: row.rows })),
      users: perUser.map((row) => ({
        user: names.get(String(row._id)) ?? 'unknown',
        conversations: row.conversations,
        inputTokens: row.inputTokens,
        outputTokens: row.outputTokens,
      })),
    };
  }

  async function resolveUserNames(ids) {
    const AdminUser = Conversation.db?.models?.['admin-user'];
    if (!AdminUser) return new Map();

    const docs = await AdminUser.find({ _id: { $in: ids.filter(Boolean) } }).select('name').lean();
    return new Map(docs.map((doc) => [String(doc._id), doc.name]));
  }

  async function sendMessage({ user, conversationId, message, nav, onEvent, signal }) {
    const text = String(message ?? '').trim();
    if (!text) throw new AppError('A message is required', 400);
    if (text.length > MAX_MESSAGE_LENGTH) {
      throw new AppError(`Keep the message under ${MAX_MESSAGE_LENGTH} characters`, 400);
    }

    const conversation = conversationId
      ? await Conversation.findOne({ _id: conversationId, user: user._id })
      : new Conversation({ user: user._id, title: text.slice(0, 80) });

    if (!conversation) throw new AppError('Conversation not found', 404);

    // History must stay append-only: trimming it would invalidate the replayed thinking blocks.
    if (conversation.turns.length >= historyLimit) {
      throw new AppError('This conversation has run long. Start a new one to carry on.', 400);
    }

    const allowed = datasetsForRole(datasets, user.role);
    const stripeClient = stripe && stripeRoles.includes(user.role) ? stripe : null;
    const adsService = ads && adsRoles.includes(user.role) ? ads : null;
    const adsWrite = Boolean(adsService) && adsWriteRoles.includes(user.role);

    const tools = buildToolDefinitions({
      datasets: allowed,
      stripe: stripeClient,
      ads: adsService,
      adsWrite,
    });

    const system = buildSystemPrompt({
      brand,
      datasets: allowed,
      stripe: Boolean(stripeClient),
      ads: Boolean(adsService),
      adsWrite,
      nav: sanitiseNav(nav),
      user,
      maxToolRounds,
    });

    const propose = async ({ kind, params, summary, details }) => {
      const action = await Action.create({
        user: user._id,
        userName: user.name,
        conversation: conversation._id,
        kind,
        params,
        summary,
        details,
        expiresAt: new Date(Date.now() + actionTtlMinutes * 60000),
      });

      return { id: String(action._id), kind, expiresAt: action.expiresAt };
    };

    conversation.turns.push({ role: 'user', content: text, at: new Date() });

    const messages = conversation.turns.map(({ role, content }) => ({ role, content: repairToolUse(content) }));
    const usage = { requests: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0 };

    let stopped = null;

    try {
      for (let round = 0; round <= maxToolRounds; round += 1) {
        const stream = anthropic.messages.stream({
          model,
          max_tokens: maxTokens,
          output_config: { effort },
          system,
          messages,
          ...(tools.length ? { tools } : {}),
        });

        const abort = () => stream.abort();
        signal?.addEventListener('abort', abort, { once: true });
        stream.on('text', (delta) => onEvent({ type: 'text', text: delta }));

        let response;
        try {
          response = await stream.finalMessage();
        } finally {
          signal?.removeEventListener('abort', abort);
        }

        usage.requests += 1;
        usage.inputTokens += response.usage?.input_tokens ?? 0;
        usage.outputTokens += response.usage?.output_tokens ?? 0;
        usage.cacheReadTokens += response.usage?.cache_read_input_tokens ?? 0;

        // An answered tool_use block is the only kind that may stay in the history.
        const content = response.stop_reason === 'tool_use' ? response.content : withoutToolUse(response.content);

        if (content.length) {
          messages.push({ role: 'assistant', content });
          conversation.turns.push({ role: 'assistant', content, at: new Date() });
        }

        if (response.stop_reason === 'refusal') {
          stopped = 'The model declined to answer that.';
          break;
        }

        if (response.stop_reason === 'max_tokens') {
          stopped = 'The answer was cut off because it hit the length limit. Ask for a narrower slice.';
          break;
        }

        if (response.stop_reason !== 'tool_use') break;

        const calls = content.filter((block) => block.type === 'tool_use');
        const results = [];

        for (const call of calls) {
          onEvent({ type: 'tool', name: call.name, input: call.input });
          const startedAt = Date.now();

          try {
            const { result, rowCount, unmasked, dataset, proposal } = await executeTool({
              name: call.name,
              input: call.input,
              datasets: allowed,
              stripe: stripeClient,
              ads: adsService,
              propose: adsWrite ? propose : null,
              role: user.role,
            });

            await recordToolCall({
              user,
              conversationId: conversation._id,
              name: call.name,
              input: call.input,
              dataset,
              rowCount,
              unmasked,
              durationMs: Date.now() - startedAt,
            });

            onEvent({ type: 'tool_result', name: call.name, dataset, rowCount });
            if (proposal) onEvent({ type: 'proposal', ...proposal });
            results.push({ type: 'tool_result', tool_use_id: call.id, content: JSON.stringify(result) });
          } catch (err) {
            await recordToolCall({
              user,
              conversationId: conversation._id,
              name: call.name,
              input: call.input,
              rowCount: 0,
              unmasked: false,
              durationMs: Date.now() - startedAt,
              error: err.message,
            });

            onEvent({
              type: 'tool_result',
              name: call.name,
              dataset: call.input?.dataset ?? (call.name.startsWith('stripe_') ? 'stripe' : null),
              rowCount: 0,
              error: err.message,
            });
            results.push({ type: 'tool_result', tool_use_id: call.id, content: err.message, is_error: true });
          }
        }

        messages.push({ role: 'user', content: results });
        conversation.turns.push({ role: 'user', content: results, at: new Date() });

        if (round === maxToolRounds) {
          stopped = 'Stopped after the maximum number of data lookups for one question.';
        }
      }
    } finally {
      conversation.usage = {
        requests: (conversation.usage?.requests ?? 0) + usage.requests,
        inputTokens: (conversation.usage?.inputTokens ?? 0) + usage.inputTokens,
        outputTokens: (conversation.usage?.outputTokens ?? 0) + usage.outputTokens,
        cacheReadTokens: (conversation.usage?.cacheReadTokens ?? 0) + usage.cacheReadTokens,
      };
      conversation.lastMessageAt = new Date();
      await conversation.save();
    }

    return { conversationId: String(conversation._id), title: conversation.title, usage, stopped };
  }

  async function listActions({ user, conversationId }) {
    const query = { user: user._id };
    if (conversationId) query.conversation = conversationId;

    const rows = await Action.find(query).sort({ createdAt: -1 }).limit(50).lean();

    return rows.map((row) => ({
      id: String(row._id),
      kind: row.kind,
      summary: row.summary,
      details: row.details,
      status: row.status,
      result: row.result,
      error: row.error,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
    }));
  }

  async function decideAction({ user, id, approve }) {
    if (!ads || !adsWriteRoles.includes(user.role)) {
      throw new AppError('You are not allowed to change the ad account', 403);
    }

    // The claim must be atomic: an approval that runs twice would create two campaigns.
    const claimed = await Action.findOneAndUpdate(
      { _id: id, user: user._id, status: 'pending' },
      { status: approve ? 'executed' : 'cancelled', decidedBy: user._id, decidedAt: new Date() },
      { new: true },
    );

    if (!claimed) {
      const existing = await Action.findOne({ _id: id, user: user._id }).lean();
      if (!existing) throw new AppError('That action was not found', 404);
      throw new AppError(`That action is already ${existing.status}`, 409);
    }

    if (!approve) {
      logger?.info('[assistant] action cancelled', { actionId: id, kind: claimed.kind, userId: String(user._id) });
      return { id, status: 'cancelled', summary: claimed.summary };
    }

    if (claimed.expiresAt.getTime() < Date.now()) {
      claimed.status = 'cancelled';
      claimed.error = 'The proposal expired before it was approved';
      await claimed.save();
      throw new AppError('That proposal expired. Ask again and approve the new one.', 410);
    }

    try {
      const result = await executeAdsAction({
        kind: claimed.kind,
        params: claimed.params,
        ads,
        performedBy: user.name ?? String(user._id),
      });

      claimed.result = result;
      await claimed.save();
      logger?.info('[assistant] action executed', { actionId: id, kind: claimed.kind, userId: String(user._id) });

      return { id, status: 'executed', summary: claimed.summary, result };
    } catch (err) {
      claimed.status = 'failed';
      claimed.error = err.message;
      await claimed.save();
      logger?.error('[assistant] action failed', { actionId: id, kind: claimed.kind, message: err.message });
      throw new AppError(`That did not go through: ${err.message}`, err.statusCode ?? 502);
    }
  }

  return {
    listConversations,
    getConversation,
    deleteConversation,
    sendMessage,
    listToolCalls,
    getUsage,
    listActions,
    decideAction,
  };
}
