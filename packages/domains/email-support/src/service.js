import { AppError } from '@travel-suite/utils';

export function createEmailSupportService({ EmailSupport, gmail, drafter, logger }) {
  async function pollAndProcess() {
    if (!gmail) {
      logger.warn('[email-support] Gmail client not configured, skipping poll');
      return;
    }

    try {
      // Get all already-processed message IDs from DB
      const existing = await EmailSupport.find({}, { gmailMessageId: 1, _id: 0 }).lean();
      const processedIds = new Set(existing.map((e) => e.gmailMessageId));

      const newMessageIds = await gmail.listUnprocessedMessages(processedIds);

      if (newMessageIds.length === 0) {
        logger.info('[email-support] No new messages to process');
        return;
      }

      logger.info(`[email-support] Processing ${newMessageIds.length} new message(s)`);

      let processed = 0;

      for (const messageId of newMessageIds) {
        try {
          const messageData = await gmail.getMessage(messageId);
          const { isSupport, draft } = await drafter.draftReply(messageData);

          const doc = {
            gmailMessageId: messageId,
            gmailThreadId: messageData.threadId,
            from: messageData.from,
            fromEmail: messageData.fromEmail,
            fromName: messageData.fromName,
            subject: messageData.subject,
            bodyText: messageData.bodyText,
            receivedAt: messageData.receivedAt,
            status: isSupport ? 'pending' : 'skipped',
            draft: isSupport ? draft : undefined,
            skippedReason: isSupport ? undefined : 'not a support query',
            skippedAt: isSupport ? undefined : new Date(),
          };

          await EmailSupport.create(doc);
          await gmail.markAsRead(messageId);
          processed++;
        } catch (err) {
          logger.error('[email-support] Failed to process message', {
            messageId,
            error: err.message,
          });
        }
      }

      logger.info(`[email-support] Processed ${processed} message(s)`);
    } catch (err) {
      logger.error('[email-support] Poll failed', { error: err.message });
    }
  }

  async function getEmails(query = {}) {
    const filter = {};
    if (query.status && query.status !== 'all') {
      filter.status = query.status;
    }

    let page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, parseInt(query.limit, 10) || 20);

    const total = await EmailSupport.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    if (page > totalPages) page = totalPages;

    const data = await EmailSupport.find(filter)
      .sort({ receivedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async function updateDraft(id, draft) {
    const updated = await EmailSupport.findByIdAndUpdate(
      id,
      { $set: { draft } },
      { new: true },
    );
    if (!updated) throw new AppError('Email not found', 404);
    return updated;
  }

  async function sendReply(id) {
    const email = await EmailSupport.findById(id);
    if (!email) throw new AppError('Email not found', 404);
    if (email.status === 'sent') throw new AppError('Email already sent', 400);
    if (!email.draft) throw new AppError('No draft to send', 400);

    await gmail.sendReply({
      to: email.fromEmail || email.from,
      subject: email.subject,
      threadId: email.gmailThreadId,
      inReplyToMessageId: email.gmailMessageId,
      body: email.draft,
    });

    email.status = 'sent';
    email.sentAt = new Date();
    await email.save();

    return email;
  }

  async function skipEmail(id) {
    const updated = await EmailSupport.findByIdAndUpdate(
      id,
      { $set: { status: 'skipped', skippedAt: new Date() } },
      { new: true },
    );
    if (!updated) throw new AppError('Email not found', 404);
    return updated;
  }

  return { pollAndProcess, getEmails, updateDraft, sendReply, skipEmail };
}
