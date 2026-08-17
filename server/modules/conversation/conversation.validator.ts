import { z } from "zod";
import { CHAT_MODELS } from "@/lib/constants";

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

/**
 * Zod validation schema for UI messages in streaming chat requests.
 */
export const uiMessageSchema = z
  .object({
    id: z.string().optional(),
    role: z.enum(["system", "user", "assistant"]),
    parts: z.array(
      z
        .object({
          type: z.string(),
          text: z.string().optional(),
        })
        .passthrough(),
    ),
  })
  .passthrough();

/**
 * Zod validation schema for workspace streaming chat requests.
 */
export const streamChatSchema = z.object({
  conversationId: z.string().optional(),
  messages: z.array(uiMessageSchema).min(1, "messages array is required"),
  model: z.enum(CHAT_MODELS).optional(),
  webSearch: z.boolean().optional(),
});

export * from "./conversation.types";

