import { ConversationController } from "@/server/modules/conversation/conversation.controller";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return ConversationController.listMessages(req, context);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return ConversationController.addMessage(req, context);
}
