import { ConversationController } from "@/server/modules/conversation/conversation.controller";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return ConversationController.getConversation(req, context);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return ConversationController.deleteConversation(req, context);
}
