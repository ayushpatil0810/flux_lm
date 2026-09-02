import { WorkspaceController } from "@/server/modules/workspace/workspace.controller";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return WorkspaceController.getWorkspace(req, context);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return WorkspaceController.updateWorkspace(req, context);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return WorkspaceController.deleteWorkspace(req, context);
}
