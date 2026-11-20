// internal-imports
import {
  ErrorResponse,
  inngest,
  prisma,
  SuccessResponse,
  type Authenticated,
  type Prisma,
  type Validated,
} from '@/core/index.js';
import { generateConversationMessageChannel } from '@/inngest/index.js';
import type { conversationIdSchema, createMessageSchema } from './zod.js';
import type { workspaceIdSchema } from '../zod.js';

// external-imports
import { validateUIMessages } from 'ai';
import type { Request, Response } from 'express';
import { getClientSubscriptionToken } from 'inngest/react';

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

  // @controller GET /:cid
  listMessages: async (
    request: Request &
      Authenticated &
      Validated<typeof workspaceIdSchema> &
      Validated<typeof conversationIdSchema>,
    response: Response
  ) => {
    const conversationId = request.validated.params.cid;

    // find conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        workspaceId: request.validated.params.id,
        workspace: {
          userId: request.user.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (!conversation) {
      throw new ErrorResponse({
        code: 404,
        message: 'Conversation not found',
      });
    }

    // find messages
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        role: true,
        parts: true,
      },
    });

    // return response with success
    return response.status(200).json(
      new SuccessResponse({
        message: 'Messages retrieved successfully',
        data: messages,
      })
    );
  },

  // @controller GET /:cid/realtime
  listConversationRealtimeToken: async (
    request: Request &
      Authenticated &
      Validated<typeof workspaceIdSchema> &
      Validated<typeof conversationIdSchema>,
    response: Response
  ) => {
    // find conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: request.validated.params.cid,
        workspaceId: request.validated.params.id,
        workspace: {
          userId: request.user.id,
        },
      },
      select: {
        id: true,
      },
    });

    // if conversation not found, throw error
    if (!conversation)
      throw new ErrorResponse({
        code: 404,
        message: 'Conversation not found',
      });

    // generate a realtime token for the conversation
    const token = await getClientSubscriptionToken(inngest, {
      channel: generateConversationMessageChannel({ conversationId: conversation.id }),
      topics: ['message', 'status'],
    });

    // return response with success
    return response.status(200).json(
      new SuccessResponse({
        data: { token },
        message: 'Realtime token generated successfully',
      })
    );
  },

  // @controller POST /:cid
  createMessage: async (
    request: Request &
      Authenticated &
      Validated<typeof workspaceIdSchema> &
      Validated<typeof createMessageSchema>,
    response: Response
  ) => {
    const conversationId = request.validated.params.cid;
    const workspaceId = request.validated.params.id;
    const message = request.validated.body.message;

    // find conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        workspaceId,
        workspace: {
          userId: request.user.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (!conversation) {
      throw new ErrorResponse({
        code: 404,
        message: 'Conversation not found',
      });
    }

    // validate the new message
    const [userMessage] = await validateUIMessages({ messages: [message] });
    if (!userMessage || userMessage.role !== 'user') {
      throw new ErrorResponse({
        code: 400,
        message: 'Invalid user message',
      });
    }

    try {
      await prisma.$transaction(async tx => {
        // update the conversation generation status to GENERATING
        await tx.conversation.update({
          where: { id: conversationId },
          data: { generationStatus: 'GENERATING' },
        });

        // persist user message
        await tx.message.create({
          data: {
            id: userMessage.id,
            conversationId,
            role: 'USER',
            parts: userMessage.parts as Prisma.InputJsonValue,
          },
        });
      });

      // invoke inngest to generate a response message asynchronously
      await inngest.send({ name: 'conversation/generate.message', data: { id: conversationId } });
    } catch (error) {
      // update the conversation generation status to FAILED
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { generationStatus: 'FAILED' },
      });

      throw error;
    }

    // return response with success
    return response.status(202).send();
  },
};
