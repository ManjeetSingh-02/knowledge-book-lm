// external-imports
import { z } from 'zod';

// schema for workspaceId
export const workspaceIdSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
});

// schema for createWorkspace
export const createWorkspaceSchema = z.object({
  body: z.object({
    title: z.string().trim().min(5).max(50),
    description: z.string().trim().min(10).max(300).optional(),
  }),
});

// schema for updateWorkspace
export const updateWorkspaceSchema = workspaceIdSchema.extend({
  body: createWorkspaceSchema.shape.body.partial().refine(data => Object.keys(data).length > 0, {
    error: 'At least one field must be provided for update',
  }),
});
