import { z } from "zod";
import {
  addMessageSchema,
  createConversationSchema,
  listConversationsQuerySchema,
  listMessagesQuerySchema,
  streamChatSchema,
} from "./conversation.validator";

export type ListConversationsQuery = z.infer<
  typeof listConversationsQuerySchema
>;
export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type AddMessageInput = z.infer<typeof addMessageSchema>;
export type ListMessagesQuery = z.infer<typeof listMessagesQuerySchema>;
export type StreamChatInput = z.infer<typeof streamChatSchema>;

export type RepositoryAddMessageInput = AddMessageInput & {
  conversationId: string;
};
