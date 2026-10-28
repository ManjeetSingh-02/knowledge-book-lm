// internal-imports
import { uploadPDF, validateZodSchema } from '@/core/index.js';
import { controller } from './controller.js';
import { createSourceSchema, sourceIdSchema, validatePdfFile } from './zod.js';

// external-imports
import { Router, type RequestHandler } from 'express';

// router for module
export const router = Router({ mergeParams: true });

// @route GET /
router.get('/', controller.listSources as RequestHandler);

// @route GET /:sid
router.get('/:sid', validateZodSchema(sourceIdSchema), controller.listSource as RequestHandler);

// @route GET /:sid/realtime
router.get(
  '/:sid/realtime',
  validateZodSchema(sourceIdSchema),
  controller.listSourceRealtimeToken as RequestHandler
);

// @route POST /
router.post(
  '/',
  uploadPDF,
  validateZodSchema(createSourceSchema),
  validatePdfFile,
  controller.createSource as RequestHandler
);

// @route DELETE /
router.delete('/', controller.deleteSources as RequestHandler);

// @route DELETE /:id
router.delete(
  '/:sid',
  validateZodSchema(sourceIdSchema),
  controller.deleteSource as RequestHandler
);
