import { z } from "zod";
import {
  addMessageSchema,
  createConversationSchema,
  streamChatSchema,
} from "./conversation.validator";

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type AddMessageInput = z.infer<typeof addMessageSchema>;
export type StreamChatInput = z.infer<typeof streamChatSchema>;

export type RepositoryAddMessageInput = AddMessageInput & {
  conversationId: string;
};
