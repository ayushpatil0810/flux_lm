import { ApiError } from "@/server/utils/api-error";
import { ConversationRepository } from "./conversation.repository";
import { CreateConversationInput, AddMessageInput } from "./conversation.validator";
import { WorkspaceService } from "../workspace/workspace.service";

/**
 * Service class encapsulating business logic and rules for Conversation management.
 */
export class ConversationService {
  /**
   * Retrieves all conversations belonging to a specific workspace.
   *
   * @param workspaceId - Workspace unique identifier.
   * @param userId - ID of the requesting user.
   * @returns List of conversation records.
   */
  static async getWorkspaceConversations(workspaceId: string, userId: string) {
    // Verify workspace ownership
    await WorkspaceService.getWorkspaceById(workspaceId, userId);
    
    return await ConversationRepository.findByWorkspaceId(workspaceId);
  }

  /**
   * Retrieves a single conversation by ID after checking user access to its workspace.
   *
   * @param id - Conversation unique identifier.
   * @param userId - ID of the user requesting access.
   * @returns Conversation record.
   * @throws {ApiError} 404 Not Found if conversation does not exist or user lacks access.
   */
  static async getConversationById(id: string, userId: string) {
    const conversation = await ConversationRepository.findById(id);
    if (!conversation) {
      throw ApiError.notFound("Conversation not found");
    }

    // Verify workspace ownership
    await WorkspaceService.getWorkspaceById(conversation.workspaceId, userId);

    return conversation;
  }

  /**
   * Creates a new conversation in a workspace.
   *
   * @param userId - ID of the creator.
   * @param input - Validated creation payload.
   * @returns Newly created conversation record.
   */
  static async createConversation(userId: string, input: CreateConversationInput) {
    // Verify workspace ownership
    await WorkspaceService.getWorkspaceById(input.workspaceId, userId);

    return await ConversationRepository.create(input);
  }

  /**
   * Deletes a conversation after verifying user access.
   *
   * @param id - Conversation unique identifier.
   * @param userId - ID of the user requesting deletion.
   * @returns Deleted conversation record.
   */
  static async deleteConversation(id: string, userId: string) {
    // Verify existence & ownership
    await ConversationService.getConversationById(id, userId);

    return await ConversationRepository.delete(id);
  }

  /**
   * Adds a message to a conversation after verifying user access.
   *
   * @param conversationId - Conversation unique identifier.
   * @param userId - ID of the user adding the message.
   * @param input - Validated message payload.
   * @returns Inserted message record.
   */
  static async addMessage(conversationId: string, userId: string, input: AddMessageInput) {
    // Verify existence & ownership
    await ConversationService.getConversationById(conversationId, userId);

    return await ConversationRepository.addMessage({
      conversationId,
      role: input.role,
      content: input.content,
      citations: input.citations,
    });
  }

  /**
   * Retrieves messages for a conversation after verifying user access.
   *
   * @param conversationId - Conversation unique identifier.
   * @param userId - ID of the user requesting messages.
   * @param limit - Optional limit on the number of returned messages.
   * @returns Array of message records.
   */
  static async getConversationMessages(conversationId: string, userId: string, limit?: number) {
    // Verify existence & ownership
    await ConversationService.getConversationById(conversationId, userId);

    return await ConversationRepository.findMessages(conversationId, limit);
  }
}
