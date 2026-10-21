import Anthropic from '@anthropic-ai/sdk';
import AssistantActionSchema from './schemas/action.schema.js';
import AssistantConversationSchema from './schemas/conversation.schema.js';
import AssistantToolCallSchema from './schemas/tool-call.schema.js';
import { normaliseDatasets } from './datasets.js';
import { createAssistantService } from './service.js';
import { createAssistantController } from './controller.js';
import { createAssistantRouterFromParts } from './router.js';
import { getOrRegisterModel } from '@travel-suite/utils/model';

export { AssistantActionSchema, AssistantConversationSchema, AssistantToolCallSchema };
export * as assistantDatasets from './presets.js';


export function createAssistantRouter({
  db,
  auth,
  anthropicApiKey,
  brand,
  datasets = [],
  stripe = null,
  stripeRoles = ['admin'],
  ads = null,
  adsRoles = ['admin'],
  adsWriteRoles = ['admin'],
  actionTtlMinutes = 30,
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
  const Action = getOrRegisterModel(db, 'assistant-action', AssistantActionSchema);

  const resolved = normaliseDatasets(datasets);
  const anthropic = new Anthropic({ apiKey: anthropicApiKey });

  const service = createAssistantService({
    anthropic,
    Conversation,
    ToolCall,
    Action,
    datasets: resolved,
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
  });

  const controller = createAssistantController({
    service,
    brand,
    model,
    datasets: resolved,
    stripe: Boolean(stripe),
    stripeRoles,
    ads: Boolean(ads),
    adsRoles,
    adsWriteRoles,
    logger,
  });
  const router = createAssistantRouterFromParts({
    controller,
    auth,
    roles,
    writeRoles: adsWriteRoles,
    messagesPerHour,
  });

  return { router, service, controller };
}
