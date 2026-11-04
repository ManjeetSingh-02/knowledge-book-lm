// internal-imports
import { validateZodSchema } from '@/core/index.js';
import { controller } from './controller.js';
import { conversationIdSchema } from './zod.js';

// external-imports
import { Router, type RequestHandler } from 'express';

// router for module
export const router = Router({ mergeParams: true });

// @route GET /
router.get('/', controller.listConversations as RequestHandler);

// @route POST /
router.post('/', controller.createConversation as RequestHandler);

// @route DELETE /
router.delete('/', controller.deleteConversations as RequestHandler);

// @route DELETE /:cid
router.delete(
  '/:cid',
  validateZodSchema(conversationIdSchema),
  controller.deleteConversation as RequestHandler
);
