import { z } from "zod";

/**
 * Zod validation schema for querying conversations.
 */
export const listConversationsQuerySchema = z.object({
  workspaceId: z.string().min(1, "workspaceId is required"),
});

/**
 * Zod validation schema for creating a new conversation.
 */
export const createConversationSchema = z.object({
  workspaceId: z.string().min(1, "workspaceId is required"),
  title: z.string().max(255).optional(),
});

/**
 * Zod validation schema for adding a message to a conversation.
 */
export const addMessageSchema = z.object({
  role: z.enum(["USER", "ASSISTANT"]),
  content: z.string().min(1, "content is required"),
  citations: z.any().optional(),
});

/**
 * Zod validation schema for querying messages.
 */
export const listMessagesQuerySchema = z.object({
  limit: z.coerce.number().positive().max(100).optional(),
});

export type ListConversationsQuery = z.infer<typeof listConversationsQuerySchema>;
export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type AddMessageInput = z.infer<typeof addMessageSchema>;
export type ListMessagesQuery = z.infer<typeof listMessagesQuerySchema>;
