// external-imports
import z from 'zod';

// schema for conversationId
export const conversationIdSchema = z.object({
  params: z.object({
    cid: z.uuid(),
  }),
});

// schema for createMessage
export const createMessageSchema = conversationIdSchema.extend({
  body: z.object({
    message: z.unknown(),
  }),
});
