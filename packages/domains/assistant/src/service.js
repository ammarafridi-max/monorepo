import { AppError } from '@travel-suite/utils';
import { datasetsForRole } from './datasets.js';
import { buildSystemPrompt, sanitiseNav } from './prompt.js';
import { buildToolDefinitions, executeTool } from './tools.js';

const MAX_MESSAGE_LENGTH = 4000;

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
  datasets,
  stripe,
  stripeRoles,
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
    const tools = buildToolDefinitions({ datasets: allowed, stripe: stripeClient });
    const system = buildSystemPrompt({
      brand,
      datasets: allowed,
      stripe: Boolean(stripeClient),
      nav: sanitiseNav(nav),
      user,
      maxToolRounds,
    });

    conversation.turns.push({ role: 'user', content: text, at: new Date() });

    const messages = conversation.turns.map(({ role, content }) => ({ role, content }));
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
            const { result, rowCount, unmasked, dataset } = await executeTool({
              name: call.name,
              input: call.input,
              datasets: allowed,
              stripe: stripeClient,
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

  return { listConversations, getConversation, deleteConversation, sendMessage };
}
