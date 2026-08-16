import { ConversationController } from "@/server/modules/conversation/conversation.controller";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  return ConversationController.listConversations(req);
}

export async function POST(req: NextRequest) {
  return ConversationController.createConversation(req);
}
