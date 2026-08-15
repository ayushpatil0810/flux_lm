import { z } from "zod";

/**
 * Zod validation schema for creating a new Workspace payload.
 */
export const createWorkspaceSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title cannot exceed 100 characters")
    .trim(),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
  icon: z.string().optional(),
  defaultModel: z.string().default("gpt-4o-mini"),
});

/**
 * Zod validation schema for updating an existing Workspace payload.
 * Makes all fields in `createWorkspaceSchema` optional.
 */
export const updateWorkspaceSchema = createWorkspaceSchema.partial();

/**
 * TypeScript type inferred from `createWorkspaceSchema`.
 */
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

/**
 * TypeScript type inferred from `updateWorkspaceSchema`.
 */
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
