// internal-imports
import { prisma, uploadToCloudinary } from '@/core/index.js';
import { type createSourceSchema } from './zod.js';

// external-imports
import { z } from 'zod';

// function to preprocess the source
export async function preProcessSource(
  workspaceId: string,
  data: z.infer<typeof createSourceSchema>['body'],
  file?: Express.Multer.File
) {
  let url: string | undefined;

  if (data.type === 'PDF') url = await uploadToCloudinary(workspaceId, file as Express.Multer.File);

  return await prisma.source.create({
    data: {
      workspaceId,
      ...data,
      ...(data.type === 'PDF' && { url }),
    },
  });
}
