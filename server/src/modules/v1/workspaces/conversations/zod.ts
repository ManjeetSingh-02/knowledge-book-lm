// external-imports
import z from 'zod';

// schema for conversationId
export const conversationIdSchema = z.object({
  params: z.object({
    cid: z.uuid(),
  }),
});
