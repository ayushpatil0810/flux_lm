import { MemoryController } from "@/server/modules/memory/memory.controller";
import { NextRequest } from "next/server";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return MemoryController.updateMemory(req, context);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return MemoryController.deleteMemory(req, context);
}
