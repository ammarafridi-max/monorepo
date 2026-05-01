import Anthropic from '@anthropic-ai/sdk';

export function createDrafter({ anthropicApiKey, brandContext }) {
  const client = new Anthropic({ apiKey: anthropicApiKey });

  const systemPrompt = [
    'You are a friendly customer support agent for a travel services company.',
    'You help customers with questions about their flight reservation documents (also called dummy tickets or flight itineraries).',
    'These documents are valid for visa applications and are verifiable on GDS systems used by travel agents and embassies.',
    'They may not appear as confirmed on airline websites — this is normal.',
    'Never describe the product as fake.',
    'Never promise refunds.',
    'Always be warm, professional, and reassuring.',
    'Respond in the same language as the customer\'s email.',
    '',
    'Brand context:',
    brandContext,
  ].join('\n');

  async function draftReply(emailData) {
    const { from, subject, bodyText } = emailData;

    const userMessage = `You have received the following customer email. First, classify whether it is a customer question or complaint that requires a reply (vs spam, a thank-you note, an automated notification, or any other non-support message).

Then, if it IS a support email, draft a helpful reply on behalf of the company.

Return your response as valid JSON in this exact format:
{"isSupport": true, "draft": "your reply here"}
or
{"isSupport": false, "draft": null}

Do not include any text outside of the JSON object.

---
From: ${from}
Subject: ${subject}

${bodyText}
---`;

    try {
      const stream = await client.messages.stream({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      });

      const message = await stream.finalMessage();
      const text = message.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('');

      // Extract JSON from response (handle potential markdown code fences)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { isSupport: false, draft: null };
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        isSupport: Boolean(parsed.isSupport),
        draft: parsed.draft || null,
      };
    } catch (err) {
      // If Claude returns invalid JSON or any other error, default to not support
      return { isSupport: false, draft: null };
    }
  }

  return { draftReply };
}
