// external-imports
import { realtime, staticSchema } from 'inngest';

export const generateConversationMessageChannel = realtime.channel({
  name: ({ conversationId }: { conversationId: string }) =>
    `generate-conversation:${conversationId}`,

  topics: {
    tokens: { schema: staticSchema<{ token: string }>() },
    result: { schema: staticSchema<{ messageId: string }>() },
  },
});
