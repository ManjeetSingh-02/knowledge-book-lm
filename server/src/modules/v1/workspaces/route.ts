// internal-imports
import { authenticate, validateZodSchema } from '@/core/index.js';
import { controller } from './controller.js';
import { createWorkspaceSchema, updateWorkspaceSchema, workspaceIdSchema } from './zod.js';

// external-imports
import { Router, type RequestHandler } from 'express';

// router for module
export const router = Router();

// all routes in this module are protected by authentication middleware
router.use(authenticate);

// @route GET /
router.get('/', controller.listWorkspaces as RequestHandler);

// @route GET /:id
router.get(
  '/:id',
  validateZodSchema(workspaceIdSchema),
  controller.listWorkspace as RequestHandler
);

// @route POST /
router.post(
  '/',
  validateZodSchema(createWorkspaceSchema),
  controller.createWorkspace as RequestHandler
);

// @route PATCH /:id
router.patch(
  '/:id',
  validateZodSchema(updateWorkspaceSchema),
  controller.updateWorkspace as RequestHandler
);

// @route DELETE /
router.delete('/', controller.deleteWorkspaces as RequestHandler);

// @route DELETE /:id
router.delete(
  '/:id',
  validateZodSchema(workspaceIdSchema),
  controller.deleteWorkspace as RequestHandler
);
