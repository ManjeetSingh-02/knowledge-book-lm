// internal-imports
import { ConversationGenerationStatus } from '@/core/index.js';

// external-imports
import { realtime } from 'inngest';
import z from 'zod';

export const generateConversationMessageChannel = realtime.channel({
  name: ({ conversationId }: { conversationId: string }) =>
    `generate-conversation-message:${conversationId}`,
  topics: {
    data: {
      schema: z
        .object({
          title: z.string().trim().nonempty().optional(),
          message: z
            .object({
              id: z.string().trim().nonempty(),
              token: z.string().nonempty(),
            })
            .optional(),
        })
        .refine(d => d.title !== undefined || d.message !== undefined, {
          message: 'At least one field must be provided',
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
