import ConversationSchema from './schemas/conversation.schema.js';
import MessageSchema from './schemas/message.schema.js';
import SavedReplySchema from './schemas/savedReply.schema.js';
import { createConversationService } from './service.js';
import { createConversationController } from './controller.js';
import { createConversationRouter } from './router.js';
import { createWhatsAppWebhookHandlers } from './webhook.js';

function getOrRegisterModel(conn, name, schema) {
  try {
    return conn.model(name);
  } catch {
    return conn.model(name, schema);
  }
}

export function createConversationsRouter({ db, auth, whatsapp, appSecret, verifyToken, onInboundMessage }) {
  const Conversation = getOrRegisterModel(db, 'conversation', ConversationSchema);
  const Message = getOrRegisterModel(db, 'conversation-message', MessageSchema);
  const SavedReply = getOrRegisterModel(db, 'conversation-saved-reply', SavedReplySchema);

  const service = createConversationService({ Conversation, Message, SavedReply, whatsapp });
  const controller = createConversationController({ service });
  const router = createConversationRouter({ controller, auth });
  const webhook = createWhatsAppWebhookHandlers({ service, appSecret, verifyToken, onInboundMessage });

  return { router, service, controller, webhook, Conversation, Message, SavedReply };
}
