import { ApiError } from "@/server/utils/api-error";
import { asyncHandler } from "@/server/utils/async-handler";
import { getZodFieldErrors } from "@/server/utils/zod-error";
import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/server/utils/auth-utils";
import { checkRateLimit } from "@/server/utils/rate-limiter";
import { ConversationService } from "@/server/modules/conversation/conversation.service";
import { streamChatSchema } from "@/server/modules/conversation/conversation.validator";

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
      await checkRateLimit(`chat:${user.id}`, { maxRequests: 15, windowMs: 60 * 1000 });
      const { id: workspaceId } = await params;
      const body = await req.json();

      const validation = streamChatSchema.safeParse(body);
      if (!validation.success) {
        throw ApiError.badRequest(
          "Validation failed",
          getZodFieldErrors(validation.error),
        );
      }

      return await ConversationService.streamWorkspaceChat(
        workspaceId,
        user.id,
        validation.data,
      );
    }
  );
}
