import { MemoryController } from "@/server/modules/memory/memory.controller";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  return MemoryController.listMemories(req);
}

export async function POST(req: NextRequest) {
  return MemoryController.createMemory(req);
}
