// internal-imports
import { SourceStatus } from '@/core/index.js';

// external-imports
import { realtime } from 'inngest';
import z from 'zod';

export const processSourceChannel = realtime.channel({
  name: ({ sourceId }: { sourceId: string }) => `process-source:${sourceId}`,
  topics: {
    status: {
      schema: z.object({
        status: z.enum([SourceStatus.PROCESSING, SourceStatus.READY, SourceStatus.FAILED]),
      }),
    },
  },
});
