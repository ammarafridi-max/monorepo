import Anthropic from '@anthropic-ai/sdk';
import AssistantConversationSchema from './schemas/conversation.schema.js';
import AssistantToolCallSchema from './schemas/tool-call.schema.js';
import { normaliseDatasets } from './datasets.js';
import { createAssistantService } from './service.js';
import { createAssistantController } from './controller.js';
import { createAssistantRouterFromParts } from './router.js';

export { AssistantConversationSchema, AssistantToolCallSchema };
export * as assistantDatasets from './presets.js';

function getOrRegisterModel(conn, name, schema) {
  try {
    return conn.model(name);
  } catch {
    return conn.model(name, schema);
  }
}

export function createAssistantRouter({
  db,
  auth,
  anthropicApiKey,
  brand,
  datasets = [],
  stripe = null,
  stripeRoles = ['admin'],
  roles = ['admin', 'agent', 'blog-manager'],
  model = 'claude-opus-5-5',
  effort = 'medium',
  maxTokens = 8000,
  maxToolRounds = 8,
  historyLimit = 60,
  messagesPerHour = 60,
  logger = null,
}) {
  if (!anthropicApiKey) throw new Error('[assistant] anthropicApiKey is required');
  if (!brand?.name) throw new Error('[assistant] brand.name is required');

  const Conversation = getOrRegisterModel(db, 'assistant-conversation', AssistantConversationSchema);
  const ToolCall = getOrRegisterModel(db, 'assistant-tool-call', AssistantToolCallSchema);

  const resolved = normaliseDatasets(datasets);
  const anthropic = new Anthropic({ apiKey: anthropicApiKey });

  const service = createAssistantService({
    anthropic,
    Conversation,
    ToolCall,
    datasets: resolved,
    stripe,
    stripeRoles,
    brand,
    model,
    effort,
    maxTokens,
    maxToolRounds,
    historyLimit,
    logger,
  });

  const controller = createAssistantController({
    service,
    brand,
    model,
    datasets: resolved,
    stripe: Boolean(stripe),
    stripeRoles,
    logger,
  });
  const router = createAssistantRouterFromParts({ controller, auth, roles, messagesPerHour });

  return { router, service, controller };
}
