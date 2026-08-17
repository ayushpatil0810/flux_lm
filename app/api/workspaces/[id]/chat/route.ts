import { ChatController } from "@/server/modules/chat/chat.controller";
import { NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return ChatController.streamWorkspaceChat(req, context);
}
