import { auth } from "@/server/auth";
import { ApiError } from "@/server/utils/api-error";
import { ApiResponse } from "@/server/utils/api-response";
import { asyncHandler } from "@/server/utils/async-handler";
import { getZodFieldErrors } from "@/server/utils/zod-error";
import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/server/utils/auth-utils";
import { ConversationService } from "./conversation.service";
import {
  addMessageSchema,
  createConversationSchema,
  listConversationsQuerySchema,
  listMessagesQuerySchema,
} from "./conversation.validator";

/**
 * Controller class handling HTTP requests and responses for Conversation operations.
 */
export class ConversationController {
  /**
   * Handles GET /api/conversations?workspaceId=...

   * Fetches all conversations for a specific workspace.
   */
  static listConversations = asyncHandler(async (req: NextRequest) => {
    const user = await getAuthenticatedUser(req);
    const { searchParams } = new URL(req.url);

    const queryParams = {
      workspaceId: searchParams.get("workspaceId") || "",
    };

    const validation = listConversationsQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      throw ApiError.badRequest(
        "Validation failed",
        getZodFieldErrors(validation.error),
      );
    }

    const conversations = await ConversationService.getWorkspaceConversations(
      validation.data.workspaceId,
      user.id,
    );
    return ApiResponse.success(conversations);
  });

  /**
   * Handles GET /api/conversations/[id]
   * Fetches a single conversation by ID.
   */
  static getConversation = asyncHandler(
    async (
      req: NextRequest,
      { params }: { params: Promise<{ id: string }> },
    ) => {
      const user = await getAuthenticatedUser(req);
      const { id } = await params;
      const conversation = await ConversationService.getConversationById(id, user.id);
      return ApiResponse.success(conversation);
    },
  );

  /**
   * Handles POST /api/conversations
   * Creates a new conversation.
   */
  static createConversation = asyncHandler(async (req: NextRequest) => {
    const user = await getAuthenticatedUser(req);
    const body = await req.json();

    const validation = createConversationSchema.safeParse(body);
    if (!validation.success) {
      throw ApiError.badRequest(
        "Validation failed",
        getZodFieldErrors(validation.error),
      );
    }

    const newConversation = await ConversationService.createConversation(
      user.id,
      validation.data,
    );
    return ApiResponse.created(newConversation, "Conversation created successfully");
  });

  /**
   * Handles DELETE /api/conversations/[id]
   * Deletes a conversation.
   */
  static deleteConversation = asyncHandler(
    async (
      req: NextRequest,
      { params }: { params: Promise<{ id: string }> },
    ) => {
      const user = await getAuthenticatedUser(req);
      const { id } = await params;
      await ConversationService.deleteConversation(id, user.id);
      return ApiResponse.success(null, "Conversation deleted successfully");
    },
  );

  /**
   * Handles GET /api/conversations/[id]/messages?limit=...
   * Fetches messages for a single conversation.
   */
  static listMessages = asyncHandler(
    async (
      req: NextRequest,
      { params }: { params: Promise<{ id: string }> },
    ) => {
      const user = await getAuthenticatedUser(req);
      const { id } = await params;
      const { searchParams } = new URL(req.url);

      const limitParam = searchParams.get("limit");
      const queryParams = limitParam ? { limit: Number(limitParam) } : {};

      const validation = listMessagesQuerySchema.safeParse(queryParams);
      if (!validation.success) {
        throw ApiError.badRequest(
          "Validation failed",
          getZodFieldErrors(validation.error),
        );
      }

      const messages = await ConversationService.getConversationMessages(
        id,
        user.id,
        validation.data.limit,
      );
      return ApiResponse.success(messages);
    },
  );

  /**
   * Handles POST /api/conversations/[id]/messages
   * Adds a new message to a conversation.
   */
  static addMessage = asyncHandler(
    async (
      req: NextRequest,
      { params }: { params: Promise<{ id: string }> },
    ) => {
      const user = await getAuthenticatedUser(req);
      const { id } = await params;
      const body = await req.json();

      const validation = addMessageSchema.safeParse(body);
      if (!validation.success) {
        throw ApiError.badRequest(
          "Validation failed",
          getZodFieldErrors(validation.error),
        );
      }

      const newMessage = await ConversationService.addMessage(
        id,
        user.id,
        validation.data,
      );
      return ApiResponse.created(newMessage, "Message added successfully");
    },
  );

  /**
   * Handles POST /api/workspaces/[id]/chat
   * Streams a RAG-enhanced AI chat response.
   */
  static streamWorkspaceChat = asyncHandler(
    async (
      req: NextRequest,
      { params }: { params: Promise<{ id: string }> },
    ) => {
      const user = await getAuthenticatedUser(req);
      const { id: workspaceId } = await params;
      const body = await req.json();

      // Ensure minimal validation, expecting { messages: UIMessage[], conversationId?, model?, webSearch? }
      if (!body.messages || !Array.isArray(body.messages)) {
        throw ApiError.badRequest("messages array is required");
      }

      return await ConversationService.streamWorkspaceChat(
        workspaceId,
        user.id,
        body
      );
    }
  );
}
