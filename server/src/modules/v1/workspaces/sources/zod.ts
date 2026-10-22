// external-imports
import { z } from 'zod';

// schema for sourceId
export const sourceIdSchema = z.object({
  params: z.object({
    sid: z.uuid(),
  }),
});
