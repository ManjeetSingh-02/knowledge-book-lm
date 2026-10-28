// internal-imports
import {
  ErrorResponse,
  inngest,
  prisma,
  SuccessResponse,
  uploadToCloudinary,
  type Validated,
} from '@/core/index.js';
import type { createSourceSchema, sourceIdSchema } from './zod.js';
import type { workspaceIdSchema } from '../zod.js';

// external-imports
import type { Request, Response } from 'express';

// controller for module
export const controller = {
  // @controller GET /
  listSources: async (
    request: Request & Validated<typeof workspaceIdSchema>,
    response: Response
  ) => {
    // find all sources
    const sources = await prisma.source.findMany({
      where: {
        workspaceId: request.validated.params.id,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        id: true,
        type: true,
        title: true,
        status: true,
        updatedAt: true,
        createdAt: true,
      },
    });

    // return response with success
    return response.status(200).json(
      new SuccessResponse({
        data: sources,
        message: 'Sources retrieved successfully',
        meta: {
          total: sources.length,
        },
      })
    );
  },

  // @controller GET /:id
  listSource: async (
    request: Request & Validated<typeof workspaceIdSchema & typeof sourceIdSchema>,
    response: Response
  ) => {
    // find source
    const source = await prisma.source.findFirst({
      where: {
        id: request.validated.params.sid,
        workspaceId: request.validated.params.id,
      },
      omit: {
        workspaceId: true,
      },
    });

    // if source not found, throw error
    if (!source)
      throw new ErrorResponse({
        code: 404,
        message: 'Source not found',
      });

    // return response with success
    return response.status(200).json(
      new SuccessResponse({
        data: source,
        message: 'Source retrieved successfully',
      })
    );
  },

  // @controller POST /
  createSource: async (
    request: Request & Validated<typeof workspaceIdSchema & typeof createSourceSchema>,
    response: Response
  ) => {
    const workspaceId = request.validated.params.id;
    const data = request.validated.body;

    // create a new source
    const source = await prisma.source.create({
      data: {
        workspaceId,
        ...data,
        ...(data.type === 'PDF' && {
          url: await uploadToCloudinary(workspaceId, request.file as Express.Multer.File),
        }),
      },
    });

    // invoke inngest to process the source asynchronously
    await inngest.send({ name: 'source/process', data: { id: source.id } });

    // return response with success
    return response.status(201).json(
      new SuccessResponse({
        data: {
          id: source.id,
        },
        message: 'Source created successfully',
      })
    );
  },

  // @controller DELETE /
  deleteSources: async (
    request: Request & Validated<typeof workspaceIdSchema>,
    response: Response
  ) => {
    // delete all sources
    await prisma.source.deleteMany({
      where: {
        workspaceId: request.validated.params.id,
      },
    });

    // return response with success
    return response.status(204).send();
  },

  // @controller DELETE /:id
  deleteSource: async (
    request: Request & Validated<typeof workspaceIdSchema & typeof sourceIdSchema>,
    response: Response
  ) => {
    // delete source
    await prisma.source.delete({
      where: {
        id: request.validated.params.sid,
        workspaceId: request.validated.params.id,
      },
    });

    // return response with success
    return response.status(204).send();
  },
};
