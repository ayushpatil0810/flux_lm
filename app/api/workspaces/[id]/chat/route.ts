import { ConversationController } from "@/server/modules/conversation/conversation.controller";
import { NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return ConversationController.streamWorkspaceChat(req, context);
}
