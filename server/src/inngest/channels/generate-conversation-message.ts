// internal-imports
import { ConversationGenerationStatus } from '@/core/index.js';

// external-imports
import { realtime } from 'inngest';
import z from 'zod';

export const generateConversationMessageChannel = realtime.channel({
  name: ({ conversationId }: { conversationId: string }) =>
    `generate-conversation-message:${conversationId}`,
  topics: {
    message: {
      schema: z.object({
        id: z.string(),
        token: z.string(),
      }),
    },
    status: {
      schema: z.object({
        status: z.enum([
          ConversationGenerationStatus.COMPLETED,
          ConversationGenerationStatus.FAILED,
        ]),
      }),
    },
  },
});
