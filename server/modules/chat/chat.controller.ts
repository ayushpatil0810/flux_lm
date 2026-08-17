import { ApiError } from "@/server/utils/api-error";
import { asyncHandler } from "@/server/utils/async-handler";
import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/server/utils/auth-utils";
import { ConversationService } from "@/server/modules/conversation/conversation.service";

/**
 * Controller class handling HTTP requests for chat interactions within workspaces.
 */
export class ChatController {
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
