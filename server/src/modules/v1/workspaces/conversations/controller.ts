// internal-imports
import {
  ErrorResponse,
  prisma,
  SuccessResponse,
  type Authenticated,
  type Validated,
} from '@/core/index.js';
import type { conversationIdSchema } from './zod.js';
import type { workspaceIdSchema } from '../zod.js';

// external-imports
import type { Request, Response } from 'express';

// controller for module
export const controller = {
  // @controller GET /
  listConversations: async (
    request: Request & Authenticated & Validated<typeof workspaceIdSchema>,
    response: Response
  ) => {
    // find all conversations
    const conversations = await prisma.conversation.findMany({
      where: {
        workspaceId: request.validated.params.id,
        workspace: {
          userId: request.user.id,
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        updatedAt: true,
      },
    });

    // return response with success
    return response.status(200).json(
      new SuccessResponse({
        message: 'Conversations retrieved successfully',
        data: conversations,
        meta: {
          total: conversations.length,
        },
      })
    );
  },

  // @controller POST /
  createConversation: async (
    request: Request & Authenticated & Validated<typeof workspaceIdSchema>,
    response: Response
  ) => {
    const workspaceId = request.validated.params.id;

    // find workspace
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        userId: request.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!workspace) {
      throw new ErrorResponse({
        code: 404,
        message: 'Workspace not found',
      });
    }

    // create a new conversation
    const conversation = await prisma.conversation.create({ data: { workspaceId } });

    // return response with success
    return response.status(201).json(
      new SuccessResponse({
        message: 'Conversation created successfully',
        data: {
          id: conversation.id,
        },
      })
    );
  },

  // @controller DELETE /
  deleteConversations: async (
    request: Request & Authenticated & Validated<typeof workspaceIdSchema>,
    response: Response
  ) => {
    // delete all conversations
    await prisma.conversation.deleteMany({
      where: {
        workspaceId: request.validated.params.id,
        workspace: {
          userId: request.user.id,
        },
      },
    });

    // return response with success
    return response.status(204).send();
  },

  // @controller DELETE /:cid
  deleteConversation: async (
    request: Request &
      Authenticated &
      Validated<typeof workspaceIdSchema> &
      Validated<typeof conversationIdSchema>,
    response: Response
  ) => {
    // delete the conversation
    await prisma.conversation.delete({
      where: {
        id: request.validated.params.cid,
        workspaceId: request.validated.params.id,
        workspace: {
          userId: request.user.id,
        },
      },
    });

    // return response with success
    return response.status(204).send();
  },
};
