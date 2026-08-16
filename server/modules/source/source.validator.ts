import { z } from "zod";

export const sourceTypeSchema = z.enum([
  "PDF",
  "WEBSITE",
  "YOUTUBE",
  "TEXT",
  "MARKDOWN",
]);

export const sourceStatusSchema = z.enum([
  "PENDING",
  "PROCESSING",
  "READY",
  "FAILED",
]);

/**
 * Zod validation schema for querying sources.
 */
export const listSourcesQuerySchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
  type: sourceTypeSchema.optional(),
  status: sourceStatusSchema.optional(),
  q: z.string().optional(),
});

/**
 * Zod validation schema for creating a new Source.
 */
export const createSourceSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
  type: sourceTypeSchema,
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title cannot exceed 200 characters")
    .trim(),
  content: z.string().optional(),
  url: z.string().url("Invalid URL format").optional().or(z.literal("")),
  status: sourceStatusSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const importWebsiteSourceSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
  url: z.string().url("Invalid URL format"),
  title: z
    .string()
    .max(200, "Title cannot exceed 200 characters")
    .trim()
    .optional(),
});

export const importPdfSourceSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
  title: z
    .string()
    .max(200, "Title cannot exceed 200 characters")
    .trim()
    .optional(),
});

export const importTextSourceSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title cannot exceed 200 characters")
    .trim(),
  content: z.string().min(1, "Content is required"),
  type: z.enum(["TEXT", "MARKDOWN"]).optional().default("TEXT"),
});

export const importYoutubeSourceSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
  url: z.string().min(1, "YouTube URL or Video ID is required"),
  title: z
    .string()
    .max(200, "Title cannot exceed 200 characters")
    .trim()
    .optional(),
});

/**
 * Zod validation schema for updating a Source.
 */
export const updateSourceSchema = z.object({
  title: z
    .string()
    .min(1, "Title cannot be empty")
    .max(200, "Title cannot exceed 200 characters")
    .trim()
    .optional(),
  content: z.string().optional(),
  url: z.string().url("Invalid URL format").optional().or(z.literal("")),
  status: sourceStatusSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Zod validation schema for bulk deleting Sources.
 */
export const bulkDeleteSourcesSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
  ids: z
    .array(z.string().min(1, "Source ID cannot be empty"))
    .min(1, "At least one source ID is required to delete"),
});

export type ListSourcesQuery = z.infer<typeof listSourcesQuerySchema>;
export type CreateSourceInput = z.infer<typeof createSourceSchema>;
export type ImportWebsiteSourceInput = z.infer<
  typeof importWebsiteSourceSchema
>;
export interface ImportPdfSourceInput {
  workspaceId: string;
  title?: string;
  file: {
    data: Buffer;
    filename: string;
    contentType?: string;
  };
}
export type ImportTextSourceInput = z.infer<typeof importTextSourceSchema>;
export type ImportYoutubeSourceInput = z.infer<
  typeof importYoutubeSourceSchema
>;
export type UpdateSourceInput = z.infer<typeof updateSourceSchema>;
export type BulkDeleteSourcesInput = z.infer<typeof bulkDeleteSourcesSchema>;


