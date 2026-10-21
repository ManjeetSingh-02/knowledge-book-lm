// internal-imports
import {
  ErrorResponse,
  prisma,
  SuccessResponse,
  type Authenticated,
  type Validated,
} from '@/core/index.js';
import { createWorkspaceSchema, updateWorkspaceSchema, workspaceIdSchema } from './zod.js';

// external-imports
import type { Request, Response } from 'express';

// controller for module
export const controller = {
  // @controller GET /
  listWorkspaces: async (request: Request & Authenticated, response: Response) => {
    // find all workspaces
    const workspaces = await prisma.workspace.findMany({
      where: {
        userId: request.user.id,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        description: true,
        updatedAt: true,
        createdAt: true,
      },
    });

    // return response with success
    return response.status(200).json(
      new SuccessResponse({
        data: workspaces,
        message: 'Workspaces retrieved successfully',
        meta: {
          total: workspaces.length,
        },
      })
    );
  },

  // @controller GET /:id
  listWorkspace: async (
    request: Request & Authenticated & Validated<typeof workspaceIdSchema>,
    response: Response
  ) => {
    // find workspace
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: request.validated.params.id,
        userId: request.user.id,
      },
      omit: {
        userId: true,
      },
    });

    // if workspace not found, throw error
    if (!workspace)
      throw new ErrorResponse({
        code: 404,
        message: 'Workspace not found',
      });

    // return response with success
    return response.status(200).json(
      new SuccessResponse({
        data: workspace,
        message: 'Workspace retrieved successfully',
      })
    );
  },

  // @controller POST /
  createWorkspace: async (
    request: Request & Authenticated & Validated<typeof createWorkspaceSchema>,
    response: Response
  ) => {
    // create a new workspace
    const workspace = await prisma.workspace.create({
      data: {
        userId: request.user.id,
        ...request.validated.body,
      },
    });

    // return response with success
    return response.status(201).json(
      new SuccessResponse({
        data: {
          id: workspace.id,
        },
        message: 'Workspace created successfully',
      })
    );
  },

  // @controller PATCH /:id
  updateWorkspace: async (
    request: Request & Authenticated & Validated<typeof updateWorkspaceSchema>,
    response: Response
  ) => {
    // update workspace
    await prisma.workspace.update({
      where: {
        id: request.validated.params.id,
        userId: request.user.id,
      },
      data: request.validated.body,
    });

    // return response with success
    return response.status(204).send();
  },

  // @controller DELETE /
  deleteWorkspaces: async (request: Request & Authenticated, response: Response) => {
    // delete all workspaces
    await prisma.workspace.deleteMany({
      where: {
        userId: request.user.id,
      },
    });

    // return response with success
    return response.status(204).send();
  },

  // @controller DELETE /:id
  deleteWorkspace: async (
    request: Request & Authenticated & Validated<typeof workspaceIdSchema>,
    response: Response
  ) => {
    // delete workspace
    await prisma.workspace.delete({
      where: {
        id: request.validated.params.id,
        userId: request.user.id,
      },
    });

    // return response with success
    return response.status(204).send();
  },
};
