// internal-imports
import { ErrorResponse, SourceType } from '@/core/index.js';

// external-imports
import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';

// schema for sourceId
export const sourceIdSchema = z.object({
  params: z.object({
    sid: z.uuid(),
  }),
});

// schema for createSource
export const createSourceSchema = z.object({
  body: z.discriminatedUnion('type', [
    z
      .object({
        type: z.literal(SourceType.PDF),
      })
      .strict(),
    z
      .object({
        type: z.literal(SourceType.WEBSITE),
        url: z.url(),
      })
      .strict(),
    z
      .object({
        type: z.literal(SourceType.TEXT),
        content: z.string().trim().nonempty(),
      })
      .strict(),
  ]),
});

// schema for pdfFile
const pdfFileSchema = z.object({
  fieldname: z.literal('file'),
  originalname: z.string().trim().nonempty(),
  encoding: z.string().trim().nonempty(),
  mimetype: z.literal('application/pdf'),
  buffer: z.instanceof(Buffer),
  size: z
    .number()
    .positive()
    .max(10 * 1024 * 1024),
});

export function validatePdfFile(request: Request, _response: Response, next: NextFunction) {
  if (request.body.type === SourceType.PDF) {
    // validate the file using zod schema
    const result = pdfFileSchema.safeParse(request.file);

    // if validation fails
    if (!result.success)
      throw new ErrorResponse({
        code: 400,
        message: 'Invalid request data',
        issues: z.flattenError(result.error).fieldErrors,
      });
  } else if (request.file)
    throw new ErrorResponse({
      code: 400,
      message: 'Invalid request data',
      issues: {
        file: ['File should only be provided for type PDF'],
      },
    });

  // forward request to next middleware
  next();
}
